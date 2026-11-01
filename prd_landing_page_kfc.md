# Product Requirement Document (PRD) - KFC Landing Page (Static & Vibe Coding)

## 1. Mục tiêu dự án
Xây dựng một trang Landing Page quảng cáo gà rán KFC siêu nhẹ, giao diện hiện đại, sử dụng hoàn toàn mã nguồn tĩnh (HTML, CSS, JavaScript) và đọc dữ liệu sản phẩm trực tiếp từ file CSV mà không cần Server/Backend.

## 2. Kiến trúc & Công nghệ (Tech Stack)
- **Frontend Framework**: Vanilla HTML5, JavaScript (ES6+ Modules / Fetch API).
- **Styling**: Tailwind CSS (qua CDN) để thiết kế nhanh, nhẹ và tối ưu responsive.
- **Database**: File `products.csv` chứa danh sách món ăn, giá cả, mô tả và đường dẫn ảnh.
- **Icons**: Lucide Icons (CDN) hoặc SVG đơn giản.
- **Backend/Database Engine**: *Không sử dụng*. Dùng `PapaParse` (CDN) hoặc thuật toán parse CSV bằng JS native để đọc file `.csv`.

## 3. Cấu trúc thư mục dự án
```text
kfc-landing-page/
├── index.html        # Trang landing page chính
├── data/
│   └── products.csv  # Database sản phẩm dạng CSV
└── README.md         # Hướng dẫn chạy dự án
```

## 4. Danh sách tính năng chính
1. **Hero Section**: Banner ấn tượng giới thiệu KFC với nút kêu gọi hành động (CTA).
2. **Menu sản phẩm động (đọc từ CSV)**:
   - Tự động đọc file `data/products.csv`.
   - Hiển thị danh sách món ăn dưới dạng Card (Thẻ sản phẩm).
   - Đọc dữ liệu: ID, Tên món, Mô tả, Giá tiền, Danh mục, Link ảnh.
3. **Bộ lọc danh mục**: Lọc sản phẩm theo (Gà Rán, Combo, Món Phụ, Thức Uống) bằng JavaScript client-side.
4. **Giỏ hàng đơn giản (Modal/Sidebar)**:
   - Thêm món vào giỏ hàng.
   - Tính tổng tiền tự động.
   - Lưu trạng thái giỏ hàng vào `localStorage`.
5. **Footer**: Thông tin liên hệ và bản quyền KFC.

## 5. Quy chuẩn Thiết kế & Hình ảnh
- **Tông màu chủ đạo**: Đỏ KFC (`#E4002B`), Trắng (`#FFFFFF`), Đen/Xám đậm.
- **Hình ảnh**: Sử dụng hình SVG/PNG tối giản, ảnh Placeholder chất lượng cao từ Unsplash (dung lượng nhẹ dưới 50KB/ảnh).