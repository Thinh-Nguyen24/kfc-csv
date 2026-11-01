/**
 * ==============================================================================
 * KFC LANDING PAGE - PAYMENT & CHECKOUT MODULE (MODULE THANH TOÁN)
 * File: js/checkout.js
 * Phiên bản: 1.0.0
 * Mô tả: Module xử lý toàn bộ nghiệp vụ kiểm tra dữ liệu khách hàng, tính toán
 *        tài chính, áp dụng mã giảm giá, sinh đơn hàng và điều hướng thanh toán.
 * ==============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.KFCCheckout = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // --------------------------------------------------------------------------
    // 1. CẤU HÌNH & HẰNG SỐ (CONSTANTS & CONFIGURATION)
    // --------------------------------------------------------------------------

    const CONFIG = {
        STORAGE_KEYS: {
            CART: 'kfc_cart',
            ORDERS: 'kfc_orders',
            LAST_ORDER: 'kfc_last_order'
        },
        SHIPPING: {
            STANDARD_FEE: 15000,           // Phí giao hàng tiêu chuẩn (VNĐ)
            FREE_SHIPPING_THRESHOLD: 100000 // Tự động miễn phí giao hàng khi đơn từ 100.000 VNĐ
        },
        PAYMENT_METHODS: {
            COD: 'COD',                     // Tiền mặt khi nhận hàng
            MOMO: 'MOMO',                   // Ví MoMo
            VNPAY: 'VNPAY',                 // Cổng thanh toán VNPAY / VNPAY-QR
            QR_CODE: 'QR_CODE'              // Quét mã QR thanh toán (VietQR 24/7)
        },
        BANK_INFO: {
            BANK_NAME: 'VietinBank (Ngân hàng TMCP Công Thương Việt Nam)',
            ACCOUNT_NUMBER: '109876543210',
            ACCOUNT_HOLDER: 'CONG TY TNHH KFC VIET NAM',
            BRANCH: 'Chi nhánh TP. Hồ Chí Minh'
        },
        MOMO_INFO: {
            PHONE: '0901234567',
            HOLDER: 'KFC VIETNAM FASTFOOD'
        },
        VNPAY_INFO: {
            MERCHANT_NAME: 'KFC VIETNAM FASTFOOD',
            TERMINAL_ID: 'KFC_VN_001',
            SUPPORTED_APPS: 'Hơn 30+ ứng dụng ngân hàng & Ví điện tử VNPAY'
        },
        // Danh sách mã giảm giá hợp lệ
        AVAILABLE_COUPONS: {
            'KFC20K': {
                code: 'KFC20K',
                type: 'FIXED',
                discountAmount: 20000,
                minOrderValue: 100000,
                description: 'Giảm 20.000đ cho đơn hàng từ 100.000đ'
            },
            'FREESHIP': {
                code: 'FREESHIP',
                type: 'FREE_SHIPPING',
                minOrderValue: 0,
                description: 'Miễn phí giao hàng toàn quốc'
            },
            'KFCLOVER': {
                code: 'KFCLOVER',
                type: 'PERCENTAGE',
                percentage: 10, // Giảm 10%
                maxDiscount: 50000,
                minOrderValue: 120000,
                description: 'Giảm 10% (tối đa 50.000đ) cho đơn từ 120.000đ'
            }
        }
    };

    // --------------------------------------------------------------------------
    // 2. LỖI NGHIỆP VỤ TÙY BIẾN (CUSTOM VALIDATION ERROR)
    // --------------------------------------------------------------------------

    class CheckoutValidationError extends Error {
        constructor(field, message) {
            super(message);
            this.name = 'CheckoutValidationError';
            this.field = field;
        }
    }

    // --------------------------------------------------------------------------
    // 3. CÁC HÀM XÁC THỰC DỮ LIỆU NGHIÊM NGẶT (VALIDATION RULES)
    // --------------------------------------------------------------------------

    /**
     * Xác thực danh sách món ăn trong giỏ hàng
     * @param {Array} cart - Mảng các sản phẩm giỏ hàng
     * @returns {boolean}
     */
    function validateCart(cart) {
        if (!Array.isArray(cart) || cart.length === 0) {
            throw new CheckoutValidationError('cart', 'Giỏ hàng đang trống! Vui lòng chọn ít nhất một món ăn.');
        }

        for (let i = 0; i < cart.length; i++) {
            const item = cart[i];
            if (!item || typeof item !== 'object') {
                throw new CheckoutValidationError(`cart[${i}]`, 'Dữ liệu món ăn không hợp lệ.');
            }
            if (!item.id && item.id !== 0) {
                throw new CheckoutValidationError(`cart[${i}].id`, 'Món ăn thiếu mã định danh (id).');
            }
            if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
                throw new CheckoutValidationError(`cart[${i}].name`, 'Món ăn thiếu tên hoặc tên rỗng.');
            }
            const price = Number(item.price);
            if (isNaN(price) || price < 0) {
                throw new CheckoutValidationError(`cart[${i}].price`, `Giá món ăn [${item.name}] không hợp lệ.`);
            }
            const qty = Number(item.qty);
            if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
                throw new CheckoutValidationError(`cart[${i}].qty`, `Số lượng món [${item.name}] phải là số nguyên lớn hơn 0.`);
            }
        }

        return true;
    }

    /**
     * Xác thực tên khách hàng
     * @param {string} name - Họ và tên
     * @returns {string} - Tên đã chuẩn hóa (trim)
     */
    function validateCustomerName(name) {
        if (!name || typeof name !== 'string') {
            throw new CheckoutValidationError('customerName', 'Vui lòng nhập họ và tên người nhận.');
        }
        const trimmed = name.trim();
        if (trimmed.length < 2) {
            throw new CheckoutValidationError('customerName', 'Họ và tên quá ngắn (tối thiểu 2 ký tự).');
        }
        if (trimmed.length > 70) {
            throw new CheckoutValidationError('customerName', 'Họ và tên không được vượt quá 70 ký tự.');
        }
        // Kiểm tra ký tự không chứa các ký tự điều khiển hay tag html
        if (/[<>{}[\]\\]/.test(trimmed)) {
            throw new CheckoutValidationError('customerName', 'Họ và tên không được chứa ký tự đặc biệt nguy hiểm.');
        }
        return trimmed;
    }

    /**
     * Xác thực số điện thoại di động Việt Nam (10 số, đầu số 03, 05, 07, 08, 09)
     * @param {string} phone - Số điện thoại
     * @returns {string} - Số điện thoại đã chuẩn hóa
     */
    function validatePhoneNumber(phone) {
        if (!phone || typeof phone !== 'string') {
            throw new CheckoutValidationError('phoneNumber', 'Vui lòng nhập số điện thoại nhận hàng.');
        }
        const cleaned = phone.replace(/[\s.-]/g, '');
        // Regex đầu số mạng VN (Viettel, Vinaphone, Mobifone, Vietnamobile, Gmobile)
        const vnPhoneRegex = /^(0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
        if (!vnPhoneRegex.test(cleaned)) {
            throw new CheckoutValidationError('phoneNumber', 'Số điện thoại không hợp lệ! Vui lòng nhập số di động 10 chữ số (VD: 0912345678).');
        }
        return cleaned;
    }

    /**
     * Xác thực địa chỉ giao hàng
     * @param {string} address - Địa chỉ
     * @returns {string} - Địa chỉ đã chuẩn hóa
     */
    function validateAddress(address) {
        if (!address || typeof address !== 'string') {
            throw new CheckoutValidationError('deliveryAddress', 'Vui lòng nhập địa chỉ giao hàng chi tiết.');
        }
        const trimmed = address.trim();
        if (trimmed.length < 5) {
            throw new CheckoutValidationError('deliveryAddress', 'Địa chỉ giao hàng quá ngắn (tối thiểu 5 ký tự, bao gồm số nhà, tên đường).');
        }
        if (trimmed.length > 255) {
            throw new CheckoutValidationError('deliveryAddress', 'Địa chỉ giao hàng không được vượt quá 255 ký tự.');
        }
        return trimmed;
    }

    /**
     * Xác thực phương thức thanh toán
     * @param {string} method - Mã phương thức
     * @returns {string}
     */
    function validatePaymentMethod(method) {
        if (!method || typeof method !== 'string') {
            throw new CheckoutValidationError('paymentMethod', 'Vui lòng chọn phương thức thanh toán.');
        }
        let upper = method.trim().toUpperCase();
        // Cho phép alias BANK_TRANSFER chuyển về QR_CODE
        if (upper === 'BANK_TRANSFER') {
            upper = CONFIG.PAYMENT_METHODS.QR_CODE;
        }
        const validMethods = Object.values(CONFIG.PAYMENT_METHODS);
        if (!validMethods.includes(upper)) {
            throw new CheckoutValidationError('paymentMethod', `Phương thức thanh toán không hợp lệ. Các hình thức hợp lệ: ${validMethods.join(', ')}.`);
        }
        return upper;
    }

    // --------------------------------------------------------------------------
    // 4. TÍNH TOÁN GIÁ TIỀN & KHUYẾN MÃI (PRICING & COUPON LOGIC)
    // --------------------------------------------------------------------------

    /**
     * Tính toán tổng phụ (Subtotal) của giỏ hàng
     * @param {Array} cart - Danh sách món ăn
     * @returns {number}
     */
    function calculateSubtotal(cart) {
        if (!Array.isArray(cart)) return 0;
        return cart.reduce((total, item) => {
            const price = Number(item.price) || 0;
            const qty = Number(item.qty) || 0;
            return total + (price * qty);
        }, 0);
    }

    /**
     * Kiểm tra và áp dụng mã giảm giá
     * @param {string} couponCode - Mã coupon do khách nhập
     * @param {number} subtotal - Tạm tính đơn hàng
     * @param {number} shippingFee - Phí giao hàng hiện tại
     * @returns {{isValid: boolean, discountAmount: number, freeShipping: boolean, message: string, coupon: object|null}}
     */
    function applyCoupon(couponCode, subtotal, shippingFee = CONFIG.SHIPPING.STANDARD_FEE) {
        if (!couponCode || typeof couponCode !== 'string' || couponCode.trim() === '') {
            return {
                isValid: false,
                discountAmount: 0,
                freeShipping: false,
                message: '',
                coupon: null
            };
        }

        const normalizedCode = couponCode.trim().toUpperCase();
        const coupon = CONFIG.AVAILABLE_COUPONS[normalizedCode];

        if (!coupon) {
            return {
                isValid: false,
                discountAmount: 0,
                freeShipping: false,
                message: `Mã giảm giá "${couponCode}" không tồn tại hoặc đã hết hạn!`,
                coupon: null
            };
        }

        if (subtotal < coupon.minOrderValue) {
            return {
                isValid: false,
                discountAmount: 0,
                freeShipping: false,
                message: `Mã "${coupon.code}" chỉ áp dụng cho đơn hàng từ ${coupon.minOrderValue.toLocaleString('vi-VN')}đ trở lên!`,
                coupon: null
            };
        }

        let discountAmount = 0;
        let freeShipping = false;

        switch (coupon.type) {
            case 'FIXED':
                discountAmount = Math.min(coupon.discountAmount, subtotal);
                break;
            case 'FREE_SHIPPING':
                freeShipping = true;
                discountAmount = 0; // Giảm vào phần phí ship
                break;
            case 'PERCENTAGE':
                const calculated = Math.round(subtotal * (coupon.percentage / 100));
                discountAmount = coupon.maxDiscount ? Math.min(calculated, coupon.maxDiscount) : calculated;
                break;
            default:
                discountAmount = 0;
        }

        return {
            isValid: true,
            discountAmount,
            freeShipping,
            message: `Áp dụng thành công mã "${coupon.code}": ${coupon.description}`,
            coupon
        };
    }

    /**
     * Tính toán tổng quan tài chính cho đơn hàng
     * @param {object} params
     * @param {Array} params.cart - Danh sách món ăn
     * @param {string} [params.couponCode] - Mã giảm giá nếu có
     * @returns {object} - Toàn bộ bảng tính chi phí
     */
    function calculatePricing({ cart, couponCode = '' }) {
        validateCart(cart);

        const subtotal = calculateSubtotal(cart);
        let standardShipping = subtotal >= CONFIG.SHIPPING.FREE_SHIPPING_THRESHOLD ? 0 : CONFIG.SHIPPING.STANDARD_FEE;
        
        const couponResult = applyCoupon(couponCode, subtotal, standardShipping);

        let finalShippingFee = standardShipping;
        if (couponResult.isValid && couponResult.freeShipping) {
            finalShippingFee = 0;
        }

        const discountTotal = couponResult.isValid ? couponResult.discountAmount : 0;
        const finalTotal = Math.max(0, subtotal + finalShippingFee - discountTotal);

        return {
            subtotal,
            standardShipping,
            shippingFee: finalShippingFee,
            isFreeShipping: finalShippingFee === 0,
            freeShippingReason: finalShippingFee === 0 
                ? (couponResult.freeShipping ? 'Mã FREESHIP' : `Đơn từ ${CONFIG.SHIPPING.FREE_SHIPPING_THRESHOLD.toLocaleString('vi-VN')}đ`)
                : null,
            discountAmount: discountTotal,
            coupon: couponResult.isValid ? couponResult.coupon : null,
            couponMessage: couponResult.message,
            couponValid: couponResult.isValid,
            finalTotal,
            itemCount: cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
        };
    }

    // --------------------------------------------------------------------------
    // 5. KHỞI TẠO ĐƠN HÀNG & SINH MÃ (ORDER GENERATOR)
    // --------------------------------------------------------------------------

    /**
     * Sinh mã đơn hàng chuẩn format: KFC-YYYYMMDD-XXXX
     * @returns {string}
     */
    function generateOrderId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        return `KFC-${year}${month}${day}-${randomPart}`;
    }

    /**
     * Tạo dữ liệu thanh toán hướng dẫn theo từng phương thức
     * @param {string} method - Phương thức thanh toán
     * @param {string} orderId - Mã đơn hàng
     * @param {number} totalAmount - Tổng số tiền
     * @returns {object}
     */
    function generatePaymentInstructions(method, orderId, totalAmount) {
        const transferSyntax = `${orderId}`;

        switch (method) {
            case CONFIG.PAYMENT_METHODS.QR_CODE:
            case 'BANK_TRANSFER': // Tương thích ngược
                const quickLinkQR = `https://img.vietqr.io/image/970415-${CONFIG.BANK_INFO.ACCOUNT_NUMBER}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(transferSyntax)}&accountName=${encodeURIComponent(CONFIG.BANK_INFO.ACCOUNT_HOLDER)}`;
                
                return {
                    method: CONFIG.PAYMENT_METHODS.QR_CODE,
                    title: 'Quét mã QR Code thanh toán (VietQR 24/7)',
                    instructions: 'Mở ứng dụng ngân hàng bất kỳ (VietinBank, VCB, Techcombank, MB...) và quét mã VietQR bên dưới để thanh toán tức thì:',
                    details: {
                        bankName: CONFIG.BANK_INFO.BANK_NAME,
                        accountNumber: CONFIG.BANK_INFO.ACCOUNT_NUMBER,
                        accountHolder: CONFIG.BANK_INFO.ACCOUNT_HOLDER,
                        amount: totalAmount,
                        syntax: transferSyntax,
                        qrUrl: quickLinkQR
                    }
                };

            case CONFIG.PAYMENT_METHODS.VNPAY:
                // Sinh mã QR cổng VNPAY chuẩn
                const vnpayQrUrl = `https://img.vietqr.io/image/970415-${CONFIG.BANK_INFO.ACCOUNT_NUMBER}-qr_only.png?amount=${totalAmount}&addInfo=${encodeURIComponent('VNPAY ' + transferSyntax)}&accountName=${encodeURIComponent(CONFIG.VNPAY_INFO.MERCHANT_NAME)}`;
                
                return {
                    method: CONFIG.PAYMENT_METHODS.VNPAY,
                    title: 'Thanh toán qua Cổng VNPAY / VNPAY-QR',
                    instructions: 'Sử dụng ứng dụng Ví VNPAY hoặc hơn 30 ứng dụng ngân hàng liên kết để quét mã VNPAY-QR:',
                    details: {
                        merchantName: CONFIG.VNPAY_INFO.MERCHANT_NAME,
                        terminalId: CONFIG.VNPAY_INFO.TERMINAL_ID,
                        supportedApps: CONFIG.VNPAY_INFO.SUPPORTED_APPS,
                        amount: totalAmount,
                        syntax: `VNPAY ${transferSyntax}`,
                        qrUrl: vnpayQrUrl
                    }
                };

            case CONFIG.PAYMENT_METHODS.MOMO:
                // Sinh mã QR MoMo nhanh
                const momoQrUrl = `https://img.vietqr.io/image/970415-${CONFIG.BANK_INFO.ACCOUNT_NUMBER}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent('MOMO ' + transferSyntax)}&accountName=${encodeURIComponent(CONFIG.MOMO_INFO.HOLDER)}`;
                
                return {
                    method: CONFIG.PAYMENT_METHODS.MOMO,
                    title: 'Thanh toán qua Ví điện tử MoMo',
                    instructions: 'Mở ứng dụng MoMo, chọn "Quét mã" hoặc chuyển tiền đến số điện thoại MoMo bên dưới:',
                    details: {
                        momoPhone: CONFIG.MOMO_INFO.PHONE,
                        momoHolder: CONFIG.MOMO_INFO.HOLDER,
                        amount: totalAmount,
                        syntax: `MOMO ${transferSyntax}`,
                        qrUrl: momoQrUrl
                    }
                };

            case CONFIG.PAYMENT_METHODS.COD:
            default:
                return {
                    method: CONFIG.PAYMENT_METHODS.COD,
                    title: 'Thanh toán tiền mặt khi nhận hàng (COD)',
                    instructions: 'Vui lòng chuẩn bị số tiền tương ứng khi shipper KFC giao thức ăn đến tận nhà.',
                    details: {
                        amount: totalAmount,
                        note: 'Kiểm tra món ăn còn nóng hổi trước khi thanh toán cho nhân viên giao hàng.'
                    }
                };
        }
    }

    /**
     * Tạo đối tượng đơn hàng hoàn chỉnh
     * @param {object} orderInput
     * @param {Array} orderInput.cart - Giỏ hàng
     * @param {string} orderInput.customerName - Tên người nhận
     * @param {string} orderInput.phoneNumber - Số điện thoại
     * @param {string} orderInput.deliveryAddress - Địa chỉ giao hàng
     * @param {string} orderInput.paymentMethod - Phương thức thanh toán
     * @param {string} [orderInput.note] - Ghi chú
     * @param {string} [orderInput.couponCode] - Mã ưu đãi
     * @returns {object} - Đơn hàng hoàn chỉnh
     */
    function createOrder(orderInput) {
        if (!orderInput || typeof orderInput !== 'object') {
            throw new CheckoutValidationError('order', 'Dữ liệu đơn hàng không hợp lệ.');
        }

        // 1. Xác thực từng trường
        validateCart(orderInput.cart);
        const customerName = validateCustomerName(orderInput.customerName);
        const phoneNumber = validatePhoneNumber(orderInput.phoneNumber);
        const deliveryAddress = validateAddress(orderInput.deliveryAddress);
        const paymentMethod = validatePaymentMethod(orderInput.paymentMethod);
        const note = (orderInput.note || '').trim();
        const couponCode = (orderInput.couponCode || '').trim();

        // 2. Tính toán tài chính
        const pricing = calculatePricing({ cart: orderInput.cart, couponCode });

        // 3. Khởi tạo mã & thông tin thanh toán
        const orderId = generateOrderId();
        const paymentDetails = generatePaymentInstructions(paymentMethod, orderId, pricing.finalTotal);

        const order = {
            orderId,
            createdAt: new Date().toISOString(),
            status: 'PENDING_CONFIRMATION',
            customer: {
                name: customerName,
                phone: phoneNumber,
                address: deliveryAddress,
                note: note || 'Không có ghi chú'
            },
            items: orderInput.cart.map(item => ({
                id: item.id,
                name: item.name,
                price: Number(item.price),
                qty: Number(item.qty),
                itemTotal: Number(item.price) * Number(item.qty),
                image: item.image || ''
            })),
            pricing: {
                subtotal: pricing.subtotal,
                shippingFee: pricing.shippingFee,
                discountAmount: pricing.discountAmount,
                finalTotal: pricing.finalTotal,
                couponUsed: pricing.coupon ? pricing.coupon.code : null
            },
            payment: {
                method: paymentMethod,
                status: paymentMethod === CONFIG.PAYMENT_METHODS.COD ? 'UNPAID' : 'AWAITING_PAYMENT',
                details: paymentDetails
            }
        };

        return order;
    }

    // --------------------------------------------------------------------------
    // 6. TÍCH HỢP BỘ LƯU TRỮ (STORAGE & CART CLEANUP)
    // --------------------------------------------------------------------------

    /**
     * Lưu đơn hàng và làm sạch giỏ hàng trong localStorage (nếu có window.localStorage)
     * @param {object} order - Đơn hàng đã tạo
     */
    function persistOrderAndClearCart(order) {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                // 1. Lưu đơn hàng mới nhất
                window.localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_ORDER, JSON.stringify(order));

                // 2. Cập nhật lịch sử danh sách đơn hàng
                const existingOrdersStr = window.localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS);
                const orderHistory = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
                orderHistory.unshift(order);
                window.localStorage.setItem(CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(orderHistory));

                // 3. Làm rỗng giỏ hàng
                window.localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify([]));

                // 4. Bắn Custom Event để các module khác (VD: Header, Giỏ hàng) tự cập nhật
                const event = new CustomEvent('kfc:orderCompleted', {
                    detail: { order }
                });
                window.dispatchEvent(event);
            } catch (err) {
                console.warn('Không thể ghi dữ liệu vào localStorage:', err);
            }
        }
    }

    // --------------------------------------------------------------------------
    // 7. PUBLIC API EXPORTS
    // --------------------------------------------------------------------------

    return {
        CONFIG,
        CheckoutValidationError,
        // Validation functions
        validateCart,
        validateCustomerName,
        validatePhoneNumber,
        validateAddress,
        validatePaymentMethod,
        // Pricing & Coupons
        calculateSubtotal,
        applyCoupon,
        calculatePricing,
        // Order lifecycle
        generateOrderId,
        generatePaymentInstructions,
        createOrder,
        persistOrderAndClearCart
    };
}));
