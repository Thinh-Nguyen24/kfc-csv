/**
 * ==============================================================================
 * KFC LANDING PAGE - CHECKOUT UI CONTROLLER (GIAO DIỆN MODULE THANH TOÁN)
 * File: js/checkout-ui.js
 * Phiên bản: 1.0.0
 * Mô tả: Quản lý hiển thị modal thanh toán, form nhập liệu, chọn phương thức
 *        thanh toán, hiển thị mã VietQR/MoMo, hóa đơn biên nhận và bắt lỗi trực quan.
 * ==============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./checkout.js'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./checkout.js'));
    } else {
        root.KFCCheckoutUI = factory(root.KFCCheckout);
    }
}(typeof self !== 'undefined' ? self : this, function (KFCCheckout) {
    'use strict';

    if (!KFCCheckout) {
        console.error('KFCCheckout core module chưa được tải! Vui lòng nhúng js/checkout.js trước.');
    }

    // State nội bộ của giao diện thanh toán
    let state = {
        cart: [],
        currentCoupon: '',
        selectedPaymentMethod: 'COD',
        isSubmitting: false,
        onOrderSuccessCallback: null
    };

    /**
     * Khởi tạo template HTML cho modal thanh toán & hóa đơn (tự tiêm vào DOM nếu chưa có)
     */
    function injectCheckoutModals() {
        if (document.getElementById('kfc-checkout-container')) return;

        const container = document.createElement('div');
        container.id = 'kfc-checkout-container';
        container.innerHTML = `
            <!-- MODAL THANH TOÁN CHÍNH -->
            <div id="kfc-checkout-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm hidden z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
                <div class="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto border border-gray-100 transform transition-all">
                    
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-red-600 via-kfc to-kfcDark text-white p-5 sm:p-6 flex justify-between items-center relative">
                        <div class="flex items-center gap-3">
                            <span class="w-10 h-10 rounded-full bg-white text-kfc font-black flex items-center justify-center text-lg shadow-md">🍗</span>
                            <div>
                                <h3 class="font-black text-lg sm:text-xl uppercase tracking-tight">Thanh Toán Đơn Hàng KFC</h3>
                                <p class="text-xs text-red-100">Giao hàng nóng giòn siêu tốc trong 30 phút</p>
                            </div>
                        </div>
                        <button type="button" onclick="KFCCheckoutUI.closeModal()" class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition">
                            ✕
                        </button>
                    </div>

                    <!-- Body Form -->
                    <form id="kfc-checkout-form" onsubmit="KFCCheckoutUI.handleSubmit(event)" class="p-5 sm:p-7 space-y-6">
                        
                        <!-- 1. Danh sách món tóm tắt -->
                        <div class="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div class="flex justify-between items-center mb-2.5">
                                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Món Đã Chọn (<span id="co-items-count">0</span>)</span>
                                <span class="text-xs text-kfc font-bold cursor-pointer hover:underline" onclick="KFCCheckoutUI.closeModal()">Đổi món</span>
                            </div>
                            <div id="co-items-list" class="max-h-36 overflow-y-auto space-y-2 pr-1 text-xs text-gray-700">
                                <!-- Render danh sách món -->
                            </div>
                        </div>

                        <!-- 2. Thông tin người nhận -->
                        <div>
                            <h4 class="font-extrabold text-sm text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span class="text-kfc">📍</span> Thông Tin Giao Hàng
                            </h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 mb-1">Họ và tên *</label>
                                    <input type="text" id="co-name" placeholder="Ví dụ: Nguyễn Văn A" required
                                           class="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kfc transition">
                                    <span id="err-co-name" class="text-[11px] text-red-500 hidden mt-1 block"></span>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 mb-1">Số điện thoại *</label>
                                    <input type="tel" id="co-phone" placeholder="Ví dụ: 0912345678" required
                                           class="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kfc transition">
                                    <span id="err-co-phone" class="text-[11px] text-red-500 hidden mt-1 block"></span>
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="block text-xs font-bold text-gray-700 mb-1">Địa chỉ nhận hàng chi tiết *</label>
                                    <input type="text" id="co-address" placeholder="Số nhà, tên đường, phường/xã, quận/huyện" required
                                           class="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kfc transition">
                                    <span id="err-co-address" class="text-[11px] text-red-500 hidden mt-1 block"></span>
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="block text-xs font-bold text-gray-700 mb-1">Ghi chú cho shipper (Tùy chọn)</label>
                                    <input type="text" id="co-note" placeholder="Ví dụ: Giao lên lầu 2, gọi trước khi đến..."
                                           class="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kfc transition">
                                </div>
                            </div>
                        </div>

                        <!-- 3. Mã giảm giá (Coupon) -->
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <span>🎟️</span> Mã Giảm Giá / Ưu Đãi
                                <span class="text-[10px] text-gray-400 font-normal">(Gợi ý: KFC20K, FREESHIP, KFCLOVER)</span>
                            </label>
                            <div class="flex gap-2">
                                <input type="text" id="co-coupon" placeholder="Nhập mã ưu đãi..."
                                       class="flex-1 text-xs sm:text-sm uppercase bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kfc">
                                <button type="button" onclick="KFCCheckoutUI.applyCouponInput()"
                                        class="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition">
                                    Áp Dụng
                                </button>
                            </div>
                            <div id="co-coupon-msg" class="text-[11px] mt-1.5 font-medium hidden"></div>
                        </div>

                        <!-- 4. Phương thức thanh toán -->
                        <div>
                            <h4 class="font-extrabold text-sm text-gray-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                                <span class="text-kfc">💳</span> Phương Thức Thanh Toán
                            </h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <!-- MoMo -->
                                <label class="payment-method-card relative flex items-center gap-2.5 p-3 rounded-2xl border-2 border-kfc bg-red-50/40 cursor-pointer transition" data-method="MOMO">
                                    <input type="radio" name="paymentMethod" value="MOMO" checked onchange="KFCCheckoutUI.handleMethodChange('MOMO')" class="accent-kfc">
                                    <div class="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center font-black text-sm">M</div>
                                    <div>
                                        <span class="block text-xs font-bold text-gray-900 leading-tight">Ví MoMo</span>
                                        <span class="text-[10px] text-gray-500">Quét mã hoặc chuyển ví</span>
                                    </div>
                                </label>

                                <!-- VNPAY -->
                                <label class="payment-method-card relative flex items-center gap-2.5 p-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition" data-method="VNPAY">
                                    <input type="radio" name="paymentMethod" value="VNPAY" onchange="KFCCheckoutUI.handleMethodChange('VNPAY')" class="accent-kfc">
                                    <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">VNP</div>
                                    <div>
                                        <span class="block text-xs font-bold text-gray-900 leading-tight">VNPAY / VNPAY-QR</span>
                                        <span class="text-[10px] text-gray-500">30+ Ngân hàng & Ví</span>
                                    </div>
                                </label>

                                <!-- QR Code Thanh Toán (VietQR) -->
                                <label class="payment-method-card relative flex items-center gap-2.5 p-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition" data-method="QR_CODE">
                                    <input type="radio" name="paymentMethod" value="QR_CODE" onchange="KFCCheckoutUI.handleMethodChange('QR_CODE')" class="accent-kfc">
                                    <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm">📲</div>
                                    <div>
                                        <span class="block text-xs font-bold text-gray-900 leading-tight">Mã QR Code (VietQR)</span>
                                        <span class="text-[10px] text-gray-500">Quét mã ngân hàng 24/7</span>
                                    </div>
                                </label>

                                <!-- COD -->
                                <label class="payment-method-card relative flex items-center gap-2.5 p-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition" data-method="COD">
                                    <input type="radio" name="paymentMethod" value="COD" onchange="KFCCheckoutUI.handleMethodChange('COD')" class="accent-kfc">
                                    <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">💵</div>
                                    <div>
                                        <span class="block text-xs font-bold text-gray-900 leading-tight">Tiền mặt (COD)</span>
                                        <span class="text-[10px] text-gray-500">Thanh toán khi nhận hàng</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- 5. Tóm tắt chi phí -->
                        <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-xs">
                            <div class="flex justify-between text-gray-600">
                                <span>Tạm tính tiền món:</span>
                                <span id="co-subtotal" class="font-bold text-gray-800">0 đ</span>
                            </div>
                            <div class="flex justify-between text-gray-600">
                                <span>Phí giao hàng:</span>
                                <span id="co-shipping" class="font-bold text-gray-800">15.000 đ</span>
                            </div>
                            <div id="co-discount-row" class="flex justify-between text-emerald-600 hidden font-semibold">
                                <span>Giảm giá khuyến mãi:</span>
                                <span id="co-discount">-0 đ</span>
                            </div>
                            <div class="border-t border-gray-200 pt-2 flex justify-between items-center text-sm">
                                <span class="font-black text-gray-900">Tổng thanh toán:</span>
                                <span id="co-final-total" class="text-xl font-black text-kfc">0 đ</span>
                            </div>
                        </div>

                        <!-- 6. Nút Đặt Hàng -->
                        <button type="submit" id="co-submit-btn" class="w-full bg-kfc hover:bg-kfcDark text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide transition shadow-lg shadow-red-500/30 flex items-center justify-center gap-2">
                            <span>🚀 Xác Nhận Đặt Hàng Ngay</span>
                        </button>
                    </form>
                </div>
            </div>

            <!-- MODAL BIÊN NHẬN / ĐẶT HÀNG THÀNH CÔNG -->
            <div id="kfc-receipt-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm hidden z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
                <div class="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-auto border border-gray-100 p-6 sm:p-8 text-center">
                    
                    <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-3xl font-black">
                        ✓
                    </div>

                    <span class="text-xs uppercase font-extrabold text-kfc tracking-widest bg-red-50 px-3 py-1 rounded-full">Đặt Hàng Thành Công</span>
                    <h3 class="text-2xl font-black text-gray-900 mt-2 mb-1">Cảm Ơn Quý Khách!</h3>
                    <p class="text-xs text-gray-500 mb-6">Đơn hàng của bạn đang được bếp KFC chuẩn bị và sẽ giao trong 30 phút.</p>

                    <!-- Chi tiết biên nhận -->
                    <div id="receipt-details" class="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left text-xs space-y-2 mb-6">
                        <!-- Render qua JS -->
                    </div>

                    <!-- Khung hướng dẫn thanh toán nếu là VietQR hoặc MoMo -->
                    <div id="receipt-payment-guide" class="mb-6 hidden">
                        <!-- Render mã QR hoặc hướng dẫn qua JS -->
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <button type="button" onclick="window.print()" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-xs transition">
                            🖨️ In Hóa Đơn
                        </button>
                        <button type="button" onclick="KFCCheckoutUI.closeReceiptModal()" class="w-full bg-kfc hover:bg-kfcDark text-white py-3 rounded-xl font-bold text-xs transition">
                            Tiếp Tục Mua Hàng
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
    }

    /**
     * Mở modal thanh toán với dữ liệu giỏ hàng
     * @param {Array} cartItems - Danh sách sản phẩm trong giỏ
     * @param {Function} [onSuccess] - Callback khi đặt hàng thành công
     */
    function openCheckout(cartItems, onSuccess = null) {
        injectCheckoutModals();

        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            alert('Giỏ hàng của bạn đang trống! Vui lòng chọn món trước khi thanh toán.');
            return;
        }

        state.cart = [...cartItems];
        state.onOrderSuccessCallback = onSuccess;
        state.selectedPaymentMethod = 'MOMO';

        // Ẩn modal giỏ hàng cũ nếu có
        const oldCartModal = document.getElementById('cart-modal');
        if (oldCartModal) oldCartModal.classList.add('hidden');

        renderCheckoutSummary();

        const modal = document.getElementById('kfc-checkout-modal');
        modal.classList.remove('hidden');
    }

    /**
     * Đóng modal thanh toán
     */
    function closeModal() {
        const modal = document.getElementById('kfc-checkout-modal');
        if (modal) modal.classList.add('hidden');
    }

    /**
     * Đóng modal biên nhận
     */
    function closeReceiptModal() {
        const modal = document.getElementById('kfc-receipt-modal');
        if (modal) modal.classList.add('hidden');
        if (typeof state.onOrderSuccessCallback === 'function') {
            state.onOrderSuccessCallback();
        }
    }

    /**
     * Render danh sách món tóm tắt & tính toán chi phí
     */
    function renderCheckoutSummary() {
        const itemsList = document.getElementById('co-items-list');
        const itemsCount = document.getElementById('co-items-count');

        itemsCount.innerText = state.cart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

        itemsList.innerHTML = state.cart.map(item => `
            <div class="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                <span class="font-semibold truncate max-w-[200px]">${item.name} <span class="text-gray-400 font-normal">x${item.qty}</span></span>
                <span class="font-extrabold text-gray-800">${(item.price * item.qty).toLocaleString('vi-VN')} đ</span>
            </div>
        `).join('');

        updatePricingUI();
    }

    /**
     * Cập nhật số liệu tài chính trên giao diện theo logic từ KFCCheckout core
     */
    function updatePricingUI() {
        try {
            const pricing = KFCCheckout.calculatePricing({
                cart: state.cart,
                couponCode: state.currentCoupon
            });

            document.getElementById('co-subtotal').innerText = pricing.subtotal.toLocaleString('vi-VN') + ' đ';
            
            const shippingElem = document.getElementById('co-shipping');
            if (pricing.isFreeShipping) {
                shippingElem.innerHTML = `<span class="text-emerald-600 font-bold">Miễn phí (${pricing.freeShippingReason})</span>`;
            } else {
                shippingElem.innerText = pricing.shippingFee.toLocaleString('vi-VN') + ' đ';
            }

            const discountRow = document.getElementById('co-discount-row');
            if (pricing.discountAmount > 0) {
                discountRow.classList.remove('hidden');
                document.getElementById('co-discount').innerText = '-' + pricing.discountAmount.toLocaleString('vi-VN') + ' đ';
            } else {
                discountRow.classList.add('hidden');
            }

            document.getElementById('co-final-total').innerText = pricing.finalTotal.toLocaleString('vi-VN') + ' đ';
        } catch (err) {
            console.error('Lỗi tính toán chi phí:', err);
        }
    }

    /**
     * Xử lý khi nhấn nút Áp dụng mã giảm giá
     */
    function applyCouponInput() {
        const input = document.getElementById('co-coupon');
        const msgElem = document.getElementById('co-coupon-msg');
        const code = input.value.trim();

        if (!code) {
            msgElem.innerText = 'Vui lòng nhập mã giảm giá!';
            msgElem.className = 'text-[11px] mt-1.5 font-medium text-red-500 block';
            return;
        }

        const subtotal = KFCCheckout.calculateSubtotal(state.cart);
        const result = KFCCheckout.applyCoupon(code, subtotal);

        if (result.isValid) {
            state.currentCoupon = code;
            msgElem.innerText = '✓ ' + result.message;
            msgElem.className = 'text-[11px] mt-1.5 font-medium text-emerald-600 block';
        } else {
            state.currentCoupon = '';
            msgElem.innerText = '✕ ' + result.message;
            msgElem.className = 'text-[11px] mt-1.5 font-medium text-red-500 block';
        }

        updatePricingUI();
    }

    /**
     * Chuyển đổi phương thức thanh toán & đổi style viền radio card
     */
    function handleMethodChange(method) {
        state.selectedPaymentMethod = method;

        document.querySelectorAll('.payment-method-card').forEach(card => {
            if (card.getAttribute('data-method') === method) {
                card.classList.add('border-kfc', 'bg-red-50/40');
                card.classList.remove('border-gray-200');
            } else {
                card.classList.remove('border-kfc', 'bg-red-50/40');
                card.classList.add('border-gray-200');
            }
        });
    }

    /**
     * Xử lý submit form đặt hàng
     */
    function handleSubmit(event) {
        event.preventDefault();

        // Xóa thông báo lỗi cũ
        document.querySelectorAll('[id^="err-co-"]').forEach(el => el.classList.add('hidden'));

        const customerName = document.getElementById('co-name').value;
        const phoneNumber = document.getElementById('co-phone').value;
        const deliveryAddress = document.getElementById('co-address').value;
        const note = document.getElementById('co-note').value;

        try {
            // Tạo đơn hàng thông qua module core
            const order = KFCCheckout.createOrder({
                cart: state.cart,
                customerName,
                phoneNumber,
                deliveryAddress,
                paymentMethod: state.selectedPaymentMethod,
                note,
                couponCode: state.currentCoupon
            });

            // Lưu trữ đơn và xóa giỏ hàng
            KFCCheckout.persistOrderAndClearCart(order);

            // Đóng modal checkout và mở modal biên nhận
            closeModal();
            showReceipt(order);

        } catch (error) {
            if (error instanceof KFCCheckout.CheckoutValidationError) {
                let targetErrId = '';
                if (error.field === 'customerName') targetErrId = 'err-co-name';
                else if (error.field === 'phoneNumber') targetErrId = 'err-co-phone';
                else if (error.field === 'deliveryAddress') targetErrId = 'err-co-address';

                if (targetErrId && document.getElementById(targetErrId)) {
                    const el = document.getElementById(targetErrId);
                    el.innerText = error.message;
                    el.classList.remove('hidden');
                } else {
                    alert(error.message);
                }
            } else {
                alert('Đã xảy ra lỗi khi xử lý thanh toán: ' + error.message);
            }
        }
    }

    /**
     * Hiển thị modal biên nhận sau khi đặt hàng thành công
     * @param {object} order - Đơn hàng đã tạo
     */
    function showReceipt(order) {
        const detailsContainer = document.getElementById('receipt-details');
        const guideContainer = document.getElementById('receipt-payment-guide');

        detailsContainer.innerHTML = `
            <div class="flex justify-between border-b pb-1.5 font-bold">
                <span class="text-gray-500">Mã đơn hàng:</span>
                <span class="text-kfc font-black text-sm">${order.orderId}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-500">Khách hàng:</span>
                <span class="font-bold text-gray-800">${order.customer.name} - ${order.customer.phone}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-500">Địa chỉ giao:</span>
                <span class="font-semibold text-gray-700 text-right max-w-[240px] truncate">${order.customer.address}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-500">Phương thức:</span>
                <span class="font-bold text-gray-800">${order.payment.details.title}</span>
            </div>
            <div class="border-t pt-1.5 flex justify-between font-extrabold text-sm">
                <span>Tổng cộng:</span>
                <span class="text-kfc text-base">${order.pricing.finalTotal.toLocaleString('vi-VN')} đ</span>
            </div>
        `;

        // Hiển thị hướng dẫn thanh toán chi tiết theo phương thức
        if (order.payment.method === 'QR_CODE' || order.payment.method === 'BANK_TRANSFER') {
            guideContainer.classList.remove('hidden');
            const d = order.payment.details.details;
            guideContainer.innerHTML = `
                <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-left">
                    <p class="font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                        <span>📲</span> Quét mã QR Code thanh toán (VietQR 24/7):
                    </p>
                    <div class="flex flex-col sm:flex-row items-center gap-4">
                        <img src="${d.qrUrl}" alt="VietQR KFC" class="w-36 h-36 object-contain rounded-xl border bg-white p-1 shadow-sm">
                        <div class="space-y-1.5 text-gray-700 flex-1 text-xs">
                            <p><strong>Ngân hàng:</strong> ${d.bankName}</p>
                            <p><strong>Số tài khoản:</strong> <code class="bg-white px-2 py-0.5 rounded text-emerald-700 font-bold border">${d.accountNumber}</code></p>
                            <p><strong>Chủ tài khoản:</strong> ${d.accountHolder}</p>
                            <p><strong>Nội dung CK:</strong> <code class="bg-yellow-100 px-2 py-0.5 rounded font-black text-red-600">${d.syntax}</code></p>
                            <p class="text-[10px] text-gray-500 italic mt-1">* Quét bằng bất kỳ ứng dụng ngân hàng nào (VietinBank, VCB, MB, Techcombank...).</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (order.payment.method === 'VNPAY') {
            guideContainer.classList.remove('hidden');
            const d = order.payment.details.details;
            guideContainer.innerHTML = `
                <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-left">
                    <p class="font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                        <span>💳</span> Quét mã VNPAY-QR thanh toán:
                    </p>
                    <div class="flex flex-col sm:flex-row items-center gap-4">
                        <img src="${d.qrUrl}" alt="VNPAY QR KFC" class="w-36 h-36 object-contain rounded-xl border bg-white p-1 shadow-sm">
                        <div class="space-y-1.5 text-gray-700 flex-1 text-xs">
                            <p><strong>Đơn vị chấp nhận:</strong> ${d.merchantName}</p>
                            <p><strong>Cú pháp thanh toán:</strong> <code class="bg-white px-2 py-0.5 rounded text-blue-700 font-bold border">${d.syntax}</code></p>
                            <p><strong>Số tiền:</strong> <span class="font-extrabold text-kfc text-sm">${d.amount.toLocaleString('vi-VN')} đ</span></p>
                            <p class="text-[10px] text-gray-600 mt-1">Hỗ trợ: <strong>${d.supportedApps}</strong></p>
                        </div>
                    </div>
                </div>
            `;
        } else if (order.payment.method === 'MOMO') {
            guideContainer.classList.remove('hidden');
            const d = order.payment.details.details;
            guideContainer.innerHTML = `
                <div class="bg-pink-50 border border-pink-200 rounded-2xl p-4 text-xs text-left">
                    <p class="font-bold text-pink-900 mb-2 flex items-center gap-1.5">
                        <span>📱</span> Quét mã Ví MoMo hoặc chuyển tiền:
                    </p>
                    <div class="flex flex-col sm:flex-row items-center gap-4">
                        <img src="${d.qrUrl}" alt="MoMo QR KFC" class="w-36 h-36 object-contain rounded-xl border bg-white p-1 shadow-sm">
                        <div class="space-y-1.5 text-gray-700 flex-1 text-xs">
                            <p><strong>Số điện thoại Ví MoMo:</strong> <code class="bg-white px-2 py-0.5 rounded text-pink-700 font-bold border">${d.momoPhone}</code></p>
                            <p><strong>Người nhận:</strong> ${d.momoHolder}</p>
                            <p><strong>Lời nhắn chuyển tiền:</strong> <code class="bg-yellow-100 px-2 py-0.5 rounded font-black text-red-600">${d.syntax}</code></p>
                            <p><strong>Số tiền:</strong> <span class="font-extrabold text-kfc text-sm">${d.amount.toLocaleString('vi-VN')} đ</span></p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            guideContainer.classList.add('hidden');
        }

        const modal = document.getElementById('kfc-receipt-modal');
        modal.classList.remove('hidden');
    }

    return {
        openCheckout,
        closeModal,
        closeReceiptModal,
        applyCouponInput,
        handleMethodChange,
        handleSubmit,
        showReceipt
    };
}));
