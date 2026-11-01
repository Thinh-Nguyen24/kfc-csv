# KFC Landing Page Source Code

Dưới đây là mã nguồn trọn gói cho dự án. Bạn có thể lưu các nội dung này vào thư mục dự án của mình.

---

### 1. File Dữ Liệu: `data/products.csv`

```csv
id,name,category,price,description,image
1,Gà Rán Giòn Tan,GaRan,39000,1 Miếng Gà Giòn Cay hoặc Gà Truyền Thống thơm ngon,https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&auto=format&fit=crop&q=60
2,Combo Gà Viên Popcorn,Combo,89000,1 Gà Popcorn vừa + 1 Khoai tây chiên + 1 Pepsi,https://images.unsplash.com/photo-1562967914-608f82629710?w=300&auto=format&fit=crop&q=60
3,Burger Zinger,Combo,55000,Burger gà giòn cay kẹp rau xà lách và sốt mayonnaise,https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=60
4,Khoai Tây Chiên,MonPhu,19000,Khoai tây chiên giòn rụm kích thước vừa,https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&auto=format&fit=crop&q=60
5,Pepsi Không Calo,ThucUong,15000,Nước ngọt Pepsi lon 330ml ướp lạnh,https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&auto=format&fit=crop&q=60
6,Combo Gia Đình,Combo,199000,6 Miếng Gà + 1 Popcorn Vừa + 2 Pepsi,https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?w=300&auto=format&fit=crop&q=60
```

---

### 2. File Giao Diện & Logic: `index.html`

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KFC - Vị Ngon Trên Từng Ngón Tay</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        kfc: '#E4002B',
                        kfcDark: '#B30022',
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50 text-gray-800 font-sans">

    <!-- Header / Navbar -->
    <header class="bg-white shadow-md sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <div class="flex items-center space-x-2">
                <span class="bg-kfc text-white font-extrabold text-2xl px-3 py-1 rounded-br-lg tracking-wider">KFC</span>
                <span class="hidden md:inline text-sm font-semibold text-gray-600">Vị Ngon Trên Từng Ngón Tay</span>
            </div>
            
            <button id="cart-btn" class="relative bg-kfc hover:bg-kfcDark text-white px-4 py-2 rounded-full font-bold transition flex items-center gap-2">
                🛒 Giỏ hàng
                <span id="cart-count" class="bg-white text-kfc text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">0</span>
            </button>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="bg-kfc text-white py-12 px-4 text-center relative overflow-hidden">
        <div class="max-w-4xl mx-auto relative z-10">
            <h1 class="text-4xl md:text-6xl font-extrabold mb-4 uppercase tracking-wide">Gà Rán Giòn Rụm!</h1>
            <p class="text-lg md:text-xl mb-6 text-red-100">Thưởng thức hương vị truyền thống 11 loại thảo mộc và gia vị độc quyền.</p>
            <a href="#menu" class="inline-block bg-white text-kfc font-bold px-8 py-3 rounded-full shadow-lg hover:bg-gray-100 transition transform hover:-translate-y-0.5">Đặt Hàng Ngay</a>
        </div>
    </section>

    <!-- Menu Section -->
    <section id="menu" class="max-w-6xl mx-auto px-4 py-12">
        <h2 class="text-3xl font-extrabold text-center text-gray-900 mb-8 uppercase border-b-4 border-kfc inline-block left-1/2 relative -translate-x-1/2 pb-1">Thực Đơn KFC</h2>

        <!-- Category Filter -->
        <div class="flex flex-wrap justify-center gap-2 mb-8" id="filter-buttons">
            <button onclick="filterCategory('All')" class="filter-btn active bg-kfc text-white px-5 py-2 rounded-full font-semibold shadow text-sm">Tất cả</button>
            <button onclick="filterCategory('GaRan')" class="filter-btn bg-white text-gray-700 hover:bg-gray-100 px-5 py-2 rounded-full font-semibold shadow text-sm">Gà Rán</button>
            <button onclick="filterCategory('Combo')" class="filter-btn bg-white text-gray-700 hover:bg-gray-100 px-5 py-2 rounded-full font-semibold shadow text-sm">Combo</button>
            <button onclick="filterCategory('MonPhu')" class="filter-btn bg-white text-gray-700 hover:bg-gray-100 px-5 py-2 rounded-full font-semibold shadow text-sm">Món Phụ</button>
            <button onclick="filterCategory('ThucUong')" class="filter-btn bg-white text-gray-700 hover:bg-gray-100 px-5 py-2 rounded-full font-semibold shadow text-sm">Thức Uống</button>
        </div>

        <!-- Product Grid -->
        <div id="product-list" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <p class="text-center col-span-full text-gray-500">Đang tải danh sách món ăn từ CSV...</p>
        </div>
    </section>

    <!-- Cart Modal -->
    <div id="cart-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex justify-end">
        <div class="bg-white w-full max-w-md h-full p-6 flex flex-col shadow-xl">
            <div class="flex justify-between items-center pb-4 border-b">
                <h3 class="text-xl font-bold text-gray-800">Giỏ hàng của bạn</h3>
                <button id="close-cart" class="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>
            
            <div id="cart-items" class="flex-1 overflow-y-auto py-4 space-y-4">
                <p class="text-gray-500 text-center">Giỏ hàng đang trống.</p>
            </div>

            <div class="border-t pt-4">
                <div class="flex justify-between font-bold text-lg mb-4">
                    <span>Tổng tiền:</span>
                    <span id="cart-total" class="text-kfc">0 VNĐ</span>
                </div>
                <button onclick="checkout()" class="w-full bg-kfc hover:bg-kfcDark text-white py-3 rounded-lg font-bold transition">Thanh Toán</button>
            </div>
        </div>
    </div>

    <!-- JavaScript Engine -->
    <script>
        let products = [];
        let cart = [];

        // 1. Thuật toán Parse CSV thủ công (Không dùng thư viện ngoài)
        function parseCSV(text) {
            const lines = text.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            return lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                let obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index];
                });
                return obj;
            });
        }

        // 2. Fetch dữ liệu từ file CSV
        async function loadProducts() {
            try {
                const response = await fetch('./data/products.csv');
                const dataText = await response.text();
                products = parseCSV(dataText);
                renderProducts(products);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu CSV:", error);
                document.getElementById('product-list').innerHTML = `<p class="text-center col-span-full text-red-500">Không thể tải danh sách sản phẩm. Hãy chắc chắn bạn đang dùng Local Server (VD: Live Server).</p>`;
            }
        }

        // 3. Hiển thị danh sách sản phẩm
        function renderProducts(items) {
            const container = document.getElementById('product-list');
            container.innerHTML = items.map(p => `
                <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition flex flex-col justify-between border border-gray-100">
                    <img src="${p.image}" alt="${p.name}" class="w-full h-48 object-cover">
                    <div class="p-4 flex-1 flex flex-col justify-between">
                        <div>
                            <h3 class="font-bold text-lg text-gray-800 mb-1">${p.name}</h3>
                            <p class="text-sm text-gray-500 mb-3 line-clamp-2">${p.description}</p>
                        </div>
                        <div class="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                            <span class="font-extrabold text-kfc text-lg">${Number(p.price).toLocaleString('vi-VN')} đ</span>
                            <button onclick="addToCart('${p.id}')" class="bg-kfc hover:bg-kfcDark text-white text-sm font-bold px-3 py-1.5 rounded-md transition">+ Thêm</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // 4. Bộ lọc danh mục
        function filterCategory(category) {
            // Update style active button
            const buttons = document.querySelectorAll('.filter-btn');
            buttons.forEach(btn => {
                btn.classList.remove('bg-kfc', 'text-white');
                btn.classList.add('bg-white', 'text-gray-700');
            });
            event.target.classList.add('bg-kfc', 'text-white');
            event.target.classList.remove('bg-white', 'text-gray-700');

            if (category === 'All') {
                renderProducts(products);
            } else {
                const filtered = products.filter(p => p.category === category);
                renderProducts(filtered);
            }
        }

        // 5. Xử lý Giỏ hàng
        function addToCart(id) {
            const product = products.find(p => p.id === id);
            const existItem = cart.find(item => item.id === id);

            if (existItem) {
                existItem.qty += 1;
            } else {
                cart.push({ ...product, qty: 1 });
            }
            updateCartUI();
        }

        function updateCartUI() {
            // Cập nhật số lượng badge
            const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
            document.getElementById('cart-count').innerText = totalQty;

            // Cập nhật danh sách món
            const container = document.getElementById('cart-items');
            if (cart.length === 0) {
                container.innerHTML = `<p class="text-gray-500 text-center">Giỏ hàng đang trống.</p>`;
            } else {
                container.innerHTML = cart.map(item => `
                    <div class="flex justify-between items-center border-b pb-2">
                        <div>
                            <h4 class="font-bold text-sm text-gray-800">${item.name}</h4>
                            <p class="text-xs text-gray-500">${Number(item.price).toLocaleString('vi-VN')} đ x ${item.qty}</p>
                        </div>
                        <span class="font-bold text-kfc">${(item.price * item.qty).toLocaleString('vi-VN')} đ</span>
                    </div>
                `).join('');
            }

            // Cập nhật tổng tiền
            const totalMoney = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            document.getElementById('cart-total').innerText = totalMoney.toLocaleString('vi-VN') + ' VNĐ';
        }

        function checkout() {
            if(cart.length === 0) return alert("Giỏ hàng của bạn đang trống!");
            alert("Cảm ơn bạn đã đặt hàng KFC! Đơn hàng sẽ được giao trong ít phút.");
            cart = [];
            updateCartUI();
            document.getElementById('cart-modal').classList.add('hidden');
        }

        // Event Listeners cho Modal
        document.getElementById('cart-btn').addEventListener('click', () => {
            document.getElementById('cart-modal').classList.remove('hidden');
        });
        document.getElementById('close-cart').addEventListener('click', () => {
            document.getElementById('cart-modal').classList.add('hidden');
        });

        // Khởi chạy khi load trang
        loadProducts();
    </script>
</body>
</html>
```