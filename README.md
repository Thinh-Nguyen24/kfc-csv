# 🍗 KFC Fried Chicken Landing Page (Static & Vibe Coding)

Dự án Landing Page quảng cáo gà rán KFC siêu nhẹ, giao diện chuẩn nhận diện thương hiệu KFC, xây dựng hoàn toàn bằng mã nguồn tĩnh (HTML5, Tailwind CSS, JavaScript ES6) và đọc dữ liệu thực đơn động trực tiếp từ file CSV mà không cần Backend/Server phức tạp.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
KFC-csv/
├── index.html                  # Giao diện Landing Page chính & Logic JavaScript
├── data/
│   └── products.csv            # Database danh sách món ăn định dạng CSV
├── images/
│   ├── KFC_logo-image.png      # Logo chính thức của KFC
│   └── products/
│       └── khoai-tay-chien.jpg # Hình ảnh sản phẩm cục bộ
├── prd_landing_page_kfc.md     # Tài liệu yêu cầu sản phẩm (PRD)
├── m_ngu_n_d_n_kfc.md          # Tài liệu mã nguồn tham khảo
└── README.md                   # Tài liệu hướng dẫn sử dụng
```

---

## 🚀 Các Tính Năng Nổi Bật

1. **Giao diện nhận diện chuẩn KFC**:
   - Tông màu đỏ đặc trưng `#E4002B`, logo KFC chính thức.
   - Hero banner bắt mắt, khẩu hiệu "Vị Ngon Trên Từng Ngón Tay", nút kêu gọi hành động (CTA) "Đặt Hàng Ngay".
   - Tương thích 100% trên cả Desktop, Tablet và Mobile.

2. **Đọc dữ liệu động từ file CSV (`data/products.csv`)**:
   - Sử dụng thuật toán parse CSV trực tiếp bằng JavaScript native (hỗ trợ dấu ngoặc kép, xử lý BOM UTF-8).
   - Tự động nạp danh sách món, hiển thị thẻ sản phẩm (Card) với hình ảnh, mô tả, phân loại và giá tiền định dạng chuẩn Việt Nam (`39.000 đ`).
   - Tích hợp **cơ chế dự phòng thông minh (Fallback)** giúp trang web hoạt động ngay cả khi mở file `.html` trực tiếp qua giao thức `file://` mà không gặp lỗi CORS.

3. **Bộ lọc danh mục & Tìm kiếm thời gian thực**:
   - Phân loại món ăn theo tabs: **Tất cả**, **Gà Rán**, **Combo**, **Món Phụ**, **Thức Uống**.
   - Thanh tìm kiếm nhanh (Search bar) theo tên món hoặc mô tả món ăn.

4. **Giỏ hàng tương tác cao cấp (Cart Drawer & LocalStorage)**:
   - Thêm món ăn nhanh với hiệu ứng rung nút giỏ hàng và Toast thông báo nổi.
   - Thanh trượt giỏ hàng (Drawer) mượt mà.
   - Cho phép tăng/giảm số lượng từng món hoặc xóa món khỏi giỏ hàng.
   - Tự động tính tổng tiền và phí giao hàng.
   - **Tự động lưu trạng thái giỏ hàng vào `localStorage`** (không mất dữ liệu khi F5 tải lại trang).
   - Modal thanh toán xác nhận thông tin khách hàng (Họ tên, SĐT, Địa chỉ nhận hàng, Hình thức thanh toán).

5. **Footer đầy đủ thông tin**:
   - Thông tin thương hiệu KFC Vietnam, hotline đặt hàng `1900 6886`, liên kết mạng xã hội và giờ phục vụ.

---

## 🛠️ Hướng Dẫn Chạy Trang Web

Bạn có thể chạy dự án bằng một trong các cách cực kỳ đơn giản sau:

### Cách 1: Sử dụng VS Code Live Server (Khuyên dùng)
1. Cài đặt tiện ích mở rộng **Live Server** trên Visual Studio Code.
2. Chuột phải vào file `index.html` và chọn **"Open with Live Server"**.
3. Trang web sẽ tự động mở trên trình duyệt tại địa chỉ `http://127.0.0.1:5500`.

### Cách 2: Dùng Python tạo Local Server
Mở terminal tại thư mục dự án và chạy lệnh:
```bash
python -m http.server 8000
```
Sau đó truy cập trình duyệt tại: [http://localhost:8000](http://localhost:8000)

### Cách 3: Dùng Node.js
```bash
npx serve
# hoặc
npx http-server -p 8000
```

### Cách 4: Mở trực tiếp (Double click)
- Nhấp đúp chuột trực tiếp vào file `index.html` để mở trong trình duyệt Chrome/Edge/Firefox. 
- Nhờ thuật toán Fallback tích hợp sẵn, toàn bộ thực đơn và tính năng giỏ hàng vẫn sẽ hiển thị mượt mà.

---

## 📋 Cấu Trúc File `data/products.csv`

Bạn có thể dễ dàng thêm bớt món ăn vào file `data/products.csv` theo định dạng sau:

```csv
id,name,category,price,description,image
1,Gà Rán Giòn Tan,GaRan,39000,1 Miếng Gà Giòn Cay hoặc Gà Truyền Thống giòn rụm chuẩn vị 11 loại thảo mộc,https://images.unsplash.com/...
```

- **id**: Mã định danh món ăn (số hoặc chữ).
- **name**: Tên món ăn hiển thị.
- **category**: Nhóm món (`GaRan`, `Combo`, `MonPhu`, `ThucUong`).
- **price**: Giá tiền (dạng số nguyên, ví dụ: 39000).
- **description**: Mô tả hương vị món ăn.
- **image**: Đường dẫn ảnh online (URL) hoặc đường dẫn nội bộ (ví dụ: `./images/products/khoai-tay-chien.jpg`).
