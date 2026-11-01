/**
 * ==============================================================================
 * KFC LANDING PAGE - BỘ TEST CASE NGHIÊM NGẶT CHO MODULE THANH TOÁN
 * File: tests/checkout.test.js
 * Mô tả: Kiểm thử đơn vị (Unit Tests) & tích hợp (Integration Tests) cho KFCCheckout
 * ==============================================================================
 */

const KFCCheckout = typeof require !== 'undefined' 
    ? require('../js/checkout.js') 
    : (window.KFCCheckout || {});

/**
 * Test Framework Mini độc lập (chạy được trên mọi môi trường Node / Browser)
 */
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        this.results = [];
        let passed = 0;
        let failed = 0;

        for (const t of this.tests) {
            try {
                await t.fn();
                this.results.push({ name: t.name, status: 'PASS' });
                passed++;
            } catch (err) {
                this.results.push({ name: t.name, status: 'FAIL', error: err });
                failed++;
            }
        }

        return {
            total: this.tests.length,
            passed,
            failed,
            results: this.results
        };
    }
}

/**
 * Các hàm assertion
 */
const assert = {
    strictEqual(actual, expected, msg = '') {
        if (actual !== expected) {
            throw new Error(`Assertion Failed: ${msg} [Kỳ vọng: ${expected}, Thực tế: ${actual}]`);
        }
    },
    deepStrictEqual(actual, expected, msg = '') {
        const a = JSON.stringify(actual);
        const e = JSON.stringify(expected);
        if (a !== e) {
            throw new Error(`Assertion Failed: ${msg} [Kỳ vọng: ${e}, Thực tế: ${a}]`);
        }
    },
    ok(value, msg = '') {
        if (!value) {
            throw new Error(`Assertion Failed: ${msg} [Giá trị phải là truthy, nhận được: ${value}]`);
        }
    },
    throws(fn, expectedErrorClass, msg = '') {
        let threw = false;
        try {
            fn();
        } catch (err) {
            threw = true;
            if (expectedErrorClass && !(err instanceof expectedErrorClass)) {
                throw new Error(`Assertion Failed: ${msg} [Kỳ vọng lỗi kiểu ${expectedErrorClass.name}, nhưng nhận được ${err.name}: ${err.message}]`);
            }
        }
        if (!threw) {
            throw new Error(`Assertion Failed: ${msg} [Kỳ vọng hàm phải ném ra lỗi nhưng không ném]`);
        }
    }
};

// Khởi tạo Runner
const runner = new TestRunner();

// ==============================================================================
// NHÓM 1: VALIDATION GIỎ HÀNG (validateCart)
// ==============================================================================

runner.test('TC01 - validateCart: Giỏ hàng rỗng [] phải ném lỗi', () => {
    assert.throws(() => {
        KFCCheckout.validateCart([]);
    }, KFCCheckout.CheckoutValidationError, 'Giỏ hàng rỗng');
});

runner.test('TC02 - validateCart: Giỏ hàng null hoặc undefined phải ném lỗi', () => {
    assert.throws(() => {
        KFCCheckout.validateCart(null);
    }, KFCCheckout.CheckoutValidationError, 'Giỏ hàng null');

    assert.throws(() => {
        KFCCheckout.validateCart(undefined);
    }, KFCCheckout.CheckoutValidationError, 'Giỏ hàng undefined');
});

runner.test('TC03 - validateCart: Món ăn thiếu id hoặc tên rỗng phải ném lỗi', () => {
    assert.throws(() => {
        KFCCheckout.validateCart([{ name: 'Gà', price: 30000, qty: 1 }]);
    }, KFCCheckout.CheckoutValidationError, 'Thiếu ID');

    assert.throws(() => {
        KFCCheckout.validateCart([{ id: 1, name: '   ', price: 30000, qty: 1 }]);
    }, KFCCheckout.CheckoutValidationError, 'Tên rỗng');
});

runner.test('TC04 - validateCart: Món ăn có giá âm hoặc không phải số phải ném lỗi', () => {
    assert.throws(() => {
        KFCCheckout.validateCart([{ id: 1, name: 'Gà Giòn', price: -5000, qty: 1 }]);
    }, KFCCheckout.CheckoutValidationError, 'Giá âm');

    assert.throws(() => {
        KFCCheckout.validateCart([{ id: 1, name: 'Gà Giòn', price: 'không phải số', qty: 1 }]);
    }, KFCCheckout.CheckoutValidationError, 'Giá NaN');
});

runner.test('TC05 - validateCart: Món ăn có số lượng <= 0 hoặc số thập phân phải ném lỗi', () => {
    assert.throws(() => {
        KFCCheckout.validateCart([{ id: 1, name: 'Gà Giòn', price: 39000, qty: 0 }]);
    }, KFCCheckout.CheckoutValidationError, 'Số lượng bằng 0');

    assert.throws(() => {
        KFCCheckout.validateCart([{ id: 1, name: 'Gà Giòn', price: 39000, qty: -2 }]);
    }, KFCCheckout.CheckoutValidationError, 'Số lượng âm');

    assert.throws(() => {
        KFCCheckout.validateCart([{ id: 1, name: 'Gà Giòn', price: 39000, qty: 1.5 }]);
    }, KFCCheckout.CheckoutValidationError, 'Số lượng thập phân');
});

runner.test('TC06 - validateCart: Giỏ hàng hợp lệ trả về true', () => {
    const validCart = [
        { id: 1, name: 'Gà Rán Giòn', price: 39000, qty: 2 },
        { id: 4, name: 'Khoai Tây Chiên', price: 19000, qty: 1 }
    ];
    assert.strictEqual(KFCCheckout.validateCart(validCart), true, 'Giỏ hàng hợp lệ');
});

// ==============================================================================
// NHÓM 2: VALIDATION HỌ TÊN KHÁCH HÀNG (validateCustomerName)
// ==============================================================================

runner.test('TC07 - validateCustomerName: Tên rỗng hoặc khoảng trắng ném lỗi', () => {
    assert.throws(() => KFCCheckout.validateCustomerName(''), KFCCheckout.CheckoutValidationError);
    assert.throws(() => KFCCheckout.validateCustomerName('    '), KFCCheckout.CheckoutValidationError);
    assert.throws(() => KFCCheckout.validateCustomerName(null), KFCCheckout.CheckoutValidationError);
});

runner.test('TC08 - validateCustomerName: Tên quá ngắn (< 2 ký tự) ném lỗi', () => {
    assert.throws(() => KFCCheckout.validateCustomerName('A'), KFCCheckout.CheckoutValidationError);
});

runner.test('TC09 - validateCustomerName: Tên chứa ký tự đặc biệt nguy hiểm (< > { }) ném lỗi', () => {
    assert.throws(() => KFCCheckout.validateCustomerName('<script>alert()</script>'), KFCCheckout.CheckoutValidationError);
});

runner.test('TC10 - validateCustomerName: Tên tiếng Việt hợp lệ được chuẩn hóa', () => {
    const input = '   Nguyễn Văn An   ';
    const result = KFCCheckout.validateCustomerName(input);
    assert.strictEqual(result, 'Nguyễn Văn An');
});

// ==============================================================================
// NHÓM 3: VALIDATION SỐ ĐIỆN THOẠI VIỆT NAM (validatePhoneNumber)
// ==============================================================================

runner.test('TC11 - validatePhoneNumber: Rỗng hoặc chứa chữ cái ném lỗi', () => {
    assert.throws(() => KFCCheckout.validatePhoneNumber(''), KFCCheckout.CheckoutValidationError);
    assert.throws(() => KFCCheckout.validatePhoneNumber('0912abc789'), KFCCheckout.CheckoutValidationError);
});

runner.test('TC12 - validatePhoneNumber: Thiếu hoặc thừa số ném lỗi', () => {
    // 9 số
    assert.throws(() => KFCCheckout.validatePhoneNumber('090123456'), KFCCheckout.CheckoutValidationError);
    // 11 số
    assert.throws(() => KFCCheckout.validatePhoneNumber('09012345678'), KFCCheckout.CheckoutValidationError);
});

runner.test('TC13 - validatePhoneNumber: Đầu số không thuộc nhà mạng VN ném lỗi', () => {
    // Đầu số bàn 02 hoặc đầu 01 cũ
    assert.throws(() => KFCCheckout.validatePhoneNumber('0281234567'), KFCCheckout.CheckoutValidationError);
    assert.throws(() => KFCCheckout.validatePhoneNumber('0123456789'), KFCCheckout.CheckoutValidationError);
});

runner.test('TC14 - validatePhoneNumber: Các đầu mạng VN hợp lệ (Viettel, Vina, Mobi) pass', () => {
    // Viettel (03x, 098)
    assert.strictEqual(KFCCheckout.validatePhoneNumber('0987654321'), '0987654321');
    assert.strictEqual(KFCCheckout.validatePhoneNumber('0389998888'), '0389998888');
    // Vinaphone (091, 088)
    assert.strictEqual(KFCCheckout.validatePhoneNumber('0912345678'), '0912345678');
    assert.strictEqual(KFCCheckout.validatePhoneNumber('0888123456'), '0888123456');
    // Mobifone (090, 079)
    assert.strictEqual(KFCCheckout.validatePhoneNumber('0909123456'), '0909123456');
    assert.strictEqual(KFCCheckout.validatePhoneNumber('0798123456'), '0798123456');
});

runner.test('TC15 - validatePhoneNumber: Tự động lọc bỏ khoảng trắng và gạch nối', () => {
    const input = ' 090-123 4567 ';
    assert.strictEqual(KFCCheckout.validatePhoneNumber(input), '0901234567');
});

// ==============================================================================
// NHÓM 4: VALIDATION ĐỊA CHỈ (validateAddress)
// ==============================================================================

runner.test('TC16 - validateAddress: Rỗng hoặc < 5 ký tự ném lỗi', () => {
    assert.throws(() => KFCCheckout.validateAddress(''), KFCCheckout.CheckoutValidationError);
    assert.throws(() => KFCCheckout.validateAddress('Nhà'), KFCCheckout.CheckoutValidationError);
});

runner.test('TC17 - validateAddress: Địa chỉ hợp lệ được chuẩn hóa', () => {
    const addr = '   48 Bến Nghé, Quận 1, TP Hồ Chí Minh   ';
    assert.strictEqual(KFCCheckout.validateAddress(addr), '48 Bến Nghé, Quận 1, TP Hồ Chí Minh');
});

// ==============================================================================
// NHÓM 5: VALIDATION PHƯƠNG THỨC THANH TOÁN (validatePaymentMethod)
// ==============================================================================

runner.test('TC18 - validatePaymentMethod: Phương thức không tồn tại ném lỗi', () => {
    assert.throws(() => KFCCheckout.validatePaymentMethod('BITCOIN'), KFCCheckout.CheckoutValidationError);
    assert.throws(() => KFCCheckout.validatePaymentMethod('PAYPAL'), KFCCheckout.CheckoutValidationError);
});

runner.test('TC19 - validatePaymentMethod: COD, MOMO, VNPAY, QR_CODE pass và tự chuẩn hóa', () => {
    assert.strictEqual(KFCCheckout.validatePaymentMethod('cod'), 'COD');
    assert.strictEqual(KFCCheckout.validatePaymentMethod('MOMO'), 'MOMO');
    assert.strictEqual(KFCCheckout.validatePaymentMethod('vnpay'), 'VNPAY');
    assert.strictEqual(KFCCheckout.validatePaymentMethod('QR_CODE'), 'QR_CODE');
    assert.strictEqual(KFCCheckout.validatePaymentMethod('BANK_TRANSFER'), 'QR_CODE'); // Alias
});

// ==============================================================================
// NHÓM 6: TÍNH TOÁN GIÁ TIỀN & TỰ ĐỘNG MIỄN PHÍ SHIP TRÊN 100K (calculatePricing)
// ==============================================================================

runner.test('TC20 - calculatePricing: Đơn hàng dưới 100k tính phí ship tiêu chuẩn 15.000đ', () => {
    const cart = [{ id: 1, name: 'Gà Giòn', price: 39000, qty: 1 }];
    const pricing = KFCCheckout.calculatePricing({ cart });

    assert.strictEqual(pricing.subtotal, 39000);
    assert.strictEqual(pricing.shippingFee, 15000);
    assert.strictEqual(pricing.isFreeShipping, false);
    assert.strictEqual(pricing.finalTotal, 54000); // 39k + 15k
});

runner.test('TC21 - calculatePricing: Đơn hàng từ 100k trở lên TỰ ĐỘNG được miễn phí ship', () => {
    // Trường hợp đúng 100.000đ
    const cartExact100k = [
        { id: 1, name: 'Gà Viên Popcorn', price: 50000, qty: 2 }
    ];
    const p1 = KFCCheckout.calculatePricing({ cart: cartExact100k });
    assert.strictEqual(p1.subtotal, 100000);
    assert.strictEqual(p1.shippingFee, 0);
    assert.strictEqual(p1.isFreeShipping, true);
    assert.strictEqual(p1.finalTotal, 100000);

    // Trường hợp > 100.000đ (199.000đ)
    const cartOver100k = [
        { id: 6, name: 'Combo Gia Đình', price: 199000, qty: 1 }
    ];
    const p2 = KFCCheckout.calculatePricing({ cart: cartOver100k });
    assert.strictEqual(p2.subtotal, 199000);
    assert.strictEqual(p2.shippingFee, 0);
    assert.strictEqual(p2.isFreeShipping, true);
    assert.strictEqual(p2.finalTotal, 199000);
});

// ==============================================================================
// NHÓM 7: ÁP DỤNG MÃ GIẢM GIÁ (applyCoupon & calculatePricing with Coupons)
// ==============================================================================

runner.test('TC22 - applyCoupon: Mã không hợp lệ trả về isValid=false', () => {
    const result = KFCCheckout.applyCoupon('MA_BAY_BA', 200000);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.discountAmount, 0);
});

runner.test('TC23 - applyCoupon: Mã KFC20K đơn dưới 100k không được áp dụng', () => {
    const result = KFCCheckout.applyCoupon('KFC20K', 80000);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.discountAmount, 0);
});

runner.test('TC24 - applyCoupon: Mã KFC20K đơn >= 100k giảm đúng 20.000đ', () => {
    const result = KFCCheckout.applyCoupon('KFC20K', 120000);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.discountAmount, 20000);
});

runner.test('TC25 - applyCoupon: Mã FREESHIP giảm phí ship về 0đ dù đơn nhỏ', () => {
    const cart = [{ id: 1, name: 'Gà Giòn', price: 39000, qty: 1 }];
    const pricing = KFCCheckout.calculatePricing({ cart, couponCode: 'FREESHIP' });

    assert.strictEqual(pricing.subtotal, 39000);
    assert.strictEqual(pricing.shippingFee, 0);
    assert.strictEqual(pricing.isFreeShipping, true);
    assert.strictEqual(pricing.finalTotal, 39000);
});

runner.test('TC26 - applyCoupon: Mã KFCLOVER giảm 10% có giới hạn tối đa 50.000đ', () => {
    // Đơn 200k -> giảm 10% là 20.000đ
    const r1 = KFCCheckout.applyCoupon('KFCLOVER', 200000);
    assert.strictEqual(r1.isValid, true);
    assert.strictEqual(r1.discountAmount, 20000);

    // Đơn 800k -> 10% là 80k nhưng trần là 50k
    const r2 = KFCCheckout.applyCoupon('KFCLOVER', 800000);
    assert.strictEqual(r2.isValid, true);
    assert.strictEqual(r2.discountAmount, 50000);
});

// ==============================================================================
// NHÓM 8: KHỞI TẠO ĐƠN HÀNG (createOrder & generatePaymentInstructions)
// ==============================================================================

runner.test('TC27 - createOrder: Tạo đơn hàng COD thành công (đơn > 100k tự freeship)', () => {
    const orderInput = {
        cart: [
            { id: 1, name: 'Gà Rán Giòn', price: 39000, qty: 2 }, // 78k
            { id: 5, name: 'Pepsi', price: 15000, qty: 2 }        // 30k -> subtotal 108k (>100k)
        ],
        customerName: 'Trần Văn Nam',
        phoneNumber: '0901234567',
        deliveryAddress: '123 Cách Mạng Tháng 8, Phường 10, Quận 3',
        paymentMethod: 'COD',
        note: 'Giao nhanh trước 12h trưa'
    };

    const order = KFCCheckout.createOrder(orderInput);

    assert.ok(order.orderId.startsWith('KFC-'), 'Mã đơn có tiền tố KFC-');
    assert.strictEqual(order.status, 'PENDING_CONFIRMATION');
    assert.strictEqual(order.customer.name, 'Trần Văn Nam');
    assert.strictEqual(order.customer.phone, '0901234567');
    assert.strictEqual(order.pricing.subtotal, 108000);
    assert.strictEqual(order.pricing.shippingFee, 0); // > 100k tự động miễn phí ship!
    assert.strictEqual(order.pricing.finalTotal, 108000);
    assert.strictEqual(order.payment.method, 'COD');
    assert.strictEqual(order.payment.status, 'UNPAID');
});

runner.test('TC28 - createOrder: Tạo đơn hàng VNPAY sinh đủ thông tin cổng VNPAY-QR', () => {
    const orderInput = {
        cart: [{ id: 6, name: 'Combo Gia Đình', price: 199000, qty: 1 }],
        customerName: 'Lê Thị Mai',
        phoneNumber: '0918889999',
        deliveryAddress: '25 Lê Duẩn, Quận 1, TP HCM',
        paymentMethod: 'VNPAY'
    };

    const order = KFCCheckout.createOrder(orderInput);

    assert.strictEqual(order.payment.method, 'VNPAY');
    assert.strictEqual(order.payment.status, 'AWAITING_PAYMENT');
    const details = order.payment.details.details;
    assert.strictEqual(details.merchantName, KFCCheckout.CONFIG.VNPAY_INFO.MERCHANT_NAME);
    assert.strictEqual(details.amount, 199000);
    assert.ok(details.syntax.includes('VNPAY'), 'Có cú pháp VNPAY');
    assert.ok(details.qrUrl.includes('vietqr.io'), 'Có link mã QR');
});

runner.test('TC29 - createOrder: Tạo đơn hàng QR_CODE sinh mã VietQR 24/7', () => {
    const orderInput = {
        cart: [{ id: 6, name: 'Combo Gia Đình', price: 199000, qty: 1 }],
        customerName: 'Lê Thị Mai',
        phoneNumber: '0918889999',
        deliveryAddress: '25 Lê Duẩn, Quận 1, TP HCM',
        paymentMethod: 'QR_CODE'
    };

    const order = KFCCheckout.createOrder(orderInput);

    assert.strictEqual(order.payment.method, 'QR_CODE');
    assert.strictEqual(order.payment.status, 'AWAITING_PAYMENT');
    const details = order.payment.details.details;
    assert.strictEqual(details.accountNumber, KFCCheckout.CONFIG.BANK_INFO.ACCOUNT_NUMBER);
    assert.strictEqual(details.amount, 199000);
    assert.strictEqual(details.syntax, order.orderId);
    assert.ok(details.qrUrl.includes('vietqr.io'), 'Có link VietQR');
});

runner.test('TC30 - createOrder: Tạo đơn hàng MOMO sinh số ví và cú pháp MoMo', () => {
    const orderInput = {
        cart: [{ id: 1, name: 'Gà Giòn', price: 39000, qty: 1 }],
        customerName: 'Nguyễn An',
        phoneNumber: '0909123456',
        deliveryAddress: '10 Nguyễn Huệ, Quận 1',
        paymentMethod: 'MOMO'
    };

    const order = KFCCheckout.createOrder(orderInput);

    assert.strictEqual(order.payment.method, 'MOMO');
    assert.strictEqual(order.payment.status, 'AWAITING_PAYMENT');
    const details = order.payment.details.details;
    assert.strictEqual(details.momoPhone, KFCCheckout.CONFIG.MOMO_INFO.PHONE);
    assert.ok(details.syntax.includes('MOMO'), 'Có cú pháp MOMO');
});

runner.test('TC31 - createOrder: Ném lỗi nếu thiếu trường bắt buộc', () => {
    assert.throws(() => {
        KFCCheckout.createOrder({
            cart: [{ id: 1, name: 'Gà', price: 39000, qty: 1 }],
            customerName: '', // Rỗng
            phoneNumber: '0901234567',
            deliveryAddress: '123 Đường A',
            paymentMethod: 'COD'
        });
    }, KFCCheckout.CheckoutValidationError);
});

// Export để chạy
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runner, assert };
}
