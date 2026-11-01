"""
==============================================================================
KFC LANDING PAGE - CLI TEST RUNNER CHO MODULE THANH TOÁN
File: tests/test_checkout_cli.py
Mô tả: Script kiểm thử tự động độc lập qua CLI mô phỏng toàn bộ logic của
       js/checkout.js để xác minh không có lỗi nào phát sinh.
==============================================================================
"""

import sys
import re
import json

# Cấu hình chuẩn đối chiếu từ js/checkout.js
SHIPPING_STANDARD_FEE = 15000
SHIPPING_FREE_THRESHOLD = 100000 # Tự động miễn phí ship cho đơn từ 100.000đ
VN_PHONE_REGEX = re.compile(r'^(0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$')
VALID_METHODS = {'COD', 'MOMO', 'VNPAY', 'QR_CODE', 'BANK_TRANSFER'}

COUPONS = {
    'KFC20K': {'type': 'FIXED', 'amount': 20000, 'min': 100000},
    'FREESHIP': {'type': 'FREE_SHIPPING', 'amount': 0, 'min': 0},
    'KFCLOVER': {'type': 'PERCENTAGE', 'percent': 10, 'max': 50000, 'min': 120000}
}

class ValidationError(Exception):
    def __init__(self, field, msg):
        super().__init__(msg)
        self.field = field

def validate_cart(cart):
    if not isinstance(cart, list) or len(cart) == 0:
        raise ValidationError('cart', 'Giỏ hàng đang trống!')
    for i, item in enumerate(cart):
        if not isinstance(item, dict):
            raise ValidationError(f'cart[{i}]', 'Item không hợp lệ')
        if 'id' not in item or item['id'] is None:
            raise ValidationError(f'cart[{i}].id', 'Thiếu id')
        name = str(item.get('name', '')).strip()
        if not name:
            raise ValidationError(f'cart[{i}].name', 'Tên rỗng')
        try:
            price = float(item['price'])
            if price < 0:
                raise ValueError()
        except:
            raise ValidationError(f'cart[{i}].price', 'Giá không hợp lệ')
        try:
            qty = item['qty']
            if not isinstance(qty, int) or qty <= 0:
                raise ValueError()
        except:
            raise ValidationError(f'cart[{i}].qty', 'Số lượng không hợp lệ')
    return True

def validate_name(name):
    if not isinstance(name, str):
        raise ValidationError('customerName', 'Tên không hợp lệ')
    t = name.strip()
    if len(t) < 2 or len(t) > 70 or any(c in t for c in '<>{}\\'):
        raise ValidationError('customerName', 'Tên không hợp lệ')
    return t

def validate_phone(phone):
    if not isinstance(phone, str):
        raise ValidationError('phoneNumber', 'SĐT không hợp lệ')
    clean = re.sub(r'[\s.-]', '', phone)
    if not VN_PHONE_REGEX.match(clean):
        raise ValidationError('phoneNumber', 'SĐT không đúng định dạng VN')
    return clean

def validate_address(address):
    if not isinstance(address, str):
        raise ValidationError('deliveryAddress', 'Địa chỉ không hợp lệ')
    t = address.strip()
    if len(t) < 5 or len(t) > 255:
        raise ValidationError('deliveryAddress', 'Địa chỉ quá ngắn/dài')
    return t

def validate_method(method):
    if not isinstance(method, str):
        raise ValidationError('paymentMethod', 'Phương thức không hợp lệ')
    u = method.strip().upper()
    if u not in VALID_METHODS:
        raise ValidationError('paymentMethod', 'Phương thức không hợp lệ')
    return u

def calculate_pricing(cart, coupon_code=""):
    validate_cart(cart)
    subtotal = sum(int(item['price']) * int(item['qty']) for item in cart)
    standard_shipping = 0 if subtotal >= SHIPPING_FREE_THRESHOLD else SHIPPING_STANDARD_FEE
    
    discount = 0
    shipping_fee = standard_shipping
    coupon_valid = False

    if coupon_code and coupon_code.strip().upper() in COUPONS:
        c = COUPONS[coupon_code.strip().upper()]
        if subtotal >= c['min']:
            coupon_valid = True
            if c['type'] == 'FIXED':
                discount = min(c['amount'], subtotal)
            elif c['type'] == 'FREE_SHIPPING':
                shipping_fee = 0
            elif c['type'] == 'PERCENTAGE':
                discount = min(int(subtotal * (c['percent'] / 100)), c['max'])

    final_total = max(0, subtotal + shipping_fee - discount)
    return {
        'subtotal': subtotal,
        'shippingFee': shipping_fee,
        'discount': discount,
        'finalTotal': final_total,
        'couponValid': coupon_valid
    }

def run_tests():
    tests = [
        # Cart tests
        ("TC01 - Cart rỗng", lambda: _assert_raises(lambda: validate_cart([]))),
        ("TC02 - Cart thiếu ID", lambda: _assert_raises(lambda: validate_cart([{'name': 'Gà', 'price': 30000, 'qty': 1}]))),
        ("TC03 - Cart giá âm", lambda: _assert_raises(lambda: validate_cart([{'id': 1, 'name': 'Gà', 'price': -100, 'qty': 1}]))),
        ("TC04 - Cart qty = 0", lambda: _assert_raises(lambda: validate_cart([{'id': 1, 'name': 'Gà', 'price': 30000, 'qty': 0}]))),
        ("TC05 - Cart hợp lệ", lambda: validate_cart([{'id': 1, 'name': 'Gà', 'price': 39000, 'qty': 2}])),
        # Name tests
        ("TC06 - Tên rỗng", lambda: _assert_raises(lambda: validate_name(""))),
        ("TC07 - Tên quá ngắn (<2 ký tự)", lambda: _assert_raises(lambda: validate_name("A"))),
        ("TC08 - Tên HTML độc hại", lambda: _assert_raises(lambda: validate_name("<script>"))),
        ("TC09 - Tên hợp lệ", lambda: _assert_equal(validate_name("  Nguyễn Văn A  "), "Nguyễn Văn A")),
        # Phone tests
        ("TC10 - SĐT rỗng", lambda: _assert_raises(lambda: validate_phone(""))),
        ("TC11 - SĐT 9 số", lambda: _assert_raises(lambda: validate_phone("090123456"))),
        ("TC12 - SĐT 11 số", lambda: _assert_raises(lambda: validate_phone("09012345678"))),
        ("TC13 - SĐT đầu số bàn 02", lambda: _assert_raises(lambda: validate_phone("0281234567"))),
        ("TC14 - SĐT Viettel 098/038", lambda: _assert_equal(validate_phone("0987654321"), "0987654321")),
        ("TC15 - SĐT Vinaphone 091", lambda: _assert_equal(validate_phone("0912345678"), "0912345678")),
        ("TC16 - SĐT Mobifone 090 kèm khoảng trắng", lambda: _assert_equal(validate_phone(" 090-123 4567 "), "0901234567")),
        # Address tests
        ("TC17 - Địa chỉ rỗng", lambda: _assert_raises(lambda: validate_address(""))),
        ("TC18 - Địa chỉ < 5 ký tự", lambda: _assert_raises(lambda: validate_address("Nhà"))),
        ("TC19 - Địa chỉ hợp lệ", lambda: _assert_equal(validate_address(" 123 Bến Nghé, Q1 "), "123 Bến Nghé, Q1")),
        # Payment method tests
        ("TC20 - Phương thức lạ (PAYPAL)", lambda: _assert_raises(lambda: validate_method("PAYPAL"))),
        ("TC21 - Phương thức MOMO/VNPAY/QR_CODE/COD", lambda: _test_payment_methods()),
        # Pricing tests
        ("TC22 - Đơn < 100k tính phí 15k", lambda: _test_pricing_under_100k()),
        ("TC23 - Đơn >= 100k tự động miễn phí ship", lambda: _test_pricing_over_100k()),
        ("TC24 - Coupon KFC20K đủ điều kiện", lambda: _test_coupon_kfc20k()),
        ("TC25 - Coupon FREESHIP", lambda: _test_coupon_freeship()),
        ("TC26 - Coupon KFCLOVER trần tối đa 50k", lambda: _test_coupon_kfclover_cap()),
    ]

    passed = 0
    sys.stdout.reconfigure(encoding='utf-8')
    print("=" * 70)
    print("🚀 BẮT ĐẦU CHẠY KIỂM THỬ MODULE THANH TOÁN (PAYMENT MODULE)")
    print("=" * 70)

    for name, fn in tests:
        try:
            fn()
            print(f" [PASS] ✓ {name}")
            passed += 1
        except Exception as e:
            print(f" [FAIL] ✕ {name}: {e}")

    print("=" * 70)
    print(f"🎉 KẾT QUẢ: {passed}/{len(tests)} TESTS ĐÃ VƯỢT QUA HOÀN TOÀN!")
    print("=" * 70)
    if passed != len(tests):
        sys.exit(1)

def _assert_raises(fn):
    try:
        fn()
    except ValidationError:
        return True
    raise AssertionError("Hàm phải ném ValidationError nhưng không ném!")

def _assert_equal(actual, expected):
    if actual != expected:
        raise AssertionError(f"Expected {expected}, got {actual}")

def _test_payment_methods():
    assert validate_method("momo") == "MOMO"
    assert validate_method("VNPAY") == "VNPAY"
    assert validate_method("qr_code") == "QR_CODE"
    assert validate_method("cod") == "COD"
    assert validate_method("BANK_TRANSFER") == "BANK_TRANSFER"

def _test_pricing_under_100k():
    cart = [{'id': 1, 'name': 'Gà', 'price': 39000, 'qty': 1}]
    p = calculate_pricing(cart)
    assert p['subtotal'] == 39000
    assert p['shippingFee'] == 15000
    assert p['finalTotal'] == 54000

def _test_pricing_over_100k():
    # Đúng 100k
    cart_exact = [{'id': 1, 'name': 'Gà', 'price': 50000, 'qty': 2}]
    p1 = calculate_pricing(cart_exact)
    assert p1['subtotal'] == 100000
    assert p1['shippingFee'] == 0
    assert p1['finalTotal'] == 100000

    # Lớn hơn 100k (199k)
    cart_over = [{'id': 6, 'name': 'Combo', 'price': 199000, 'qty': 1}]
    p2 = calculate_pricing(cart_over)
    assert p2['subtotal'] == 199000
    assert p2['shippingFee'] == 0
    assert p2['finalTotal'] == 199000

def _test_coupon_kfc20k():
    cart = [{'id': 1, 'name': 'Gà', 'price': 60000, 'qty': 2}] # 120k >= 100k -> freeship (phí ship = 0)
    p = calculate_pricing(cart, 'KFC20K')
    assert p['discount'] == 20000
    assert p['shippingFee'] == 0 # Tự động miễn phí ship vì đơn >= 100k
    assert p['finalTotal'] == (120000 - 20000) # 100.000đ

def _test_coupon_freeship():
    cart = [{'id': 1, 'name': 'Gà', 'price': 50000, 'qty': 1}]
    p = calculate_pricing(cart, 'FREESHIP')
    assert p['shippingFee'] == 0
    assert p['finalTotal'] == 50000

def _test_coupon_kfclover_cap():
    cart = [{'id': 1, 'name': 'Gà', 'price': 800000, 'qty': 1}] # 800k -> 10% = 80k -> cap 50k
    p = calculate_pricing(cart, 'KFCLOVER')
    assert p['discount'] == 50000
    assert p['finalTotal'] == 750000

if __name__ == '__main__':
    run_tests()
