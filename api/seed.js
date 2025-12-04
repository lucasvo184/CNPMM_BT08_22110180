const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const Favorite = require('./models/Favorite');
const ViewHistory = require('./models/ViewHistory');
const Comment = require('./models/Comment');
const Order = require('./models/Order');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product_db';

// Sample data
const users = [
  { name: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'admin' },
  { name: 'Nguyễn Văn A', email: 'user1@example.com', password: 'user123' },
  { name: 'Trần Thị B', email: 'user2@example.com', password: 'user123' },
  { name: 'Lê Văn C', email: 'user3@example.com', password: 'user123' },
  { name: 'Phạm Thị D', email: 'user4@example.com', password: 'user123' },
];

const products = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình Super Retina XDR 6.7 inch',
    price: 34990000,
    originalPrice: 37990000,
    images: ['https://picsum.photos/400/400?random=1'],
    category: 'Điện thoại',
    brand: 'Apple',
    tags: ['iphone', 'apple', 'flagship', 'cao cấp'],
    stock: 50,
    rating: 4.8
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Samsung Galaxy S24 Ultra với Snapdragon 8 Gen 3, camera 200MP, S Pen tích hợp',
    price: 31990000,
    originalPrice: 33990000,
    images: ['https://picsum.photos/400/400?random=2'],
    category: 'Điện thoại',
    brand: 'Samsung',
    tags: ['samsung', 'galaxy', 'flagship', 'cao cấp'],
    stock: 40,
    rating: 4.7
  },
  {
    name: 'MacBook Pro 14 inch M3 Pro',
    description: 'MacBook Pro 14 inch với chip M3 Pro, 18GB RAM, 512GB SSD, màn hình Liquid Retina XDR',
    price: 49990000,
    originalPrice: 52990000,
    images: ['https://picsum.photos/400/400?random=3'],
    category: 'Laptop',
    brand: 'Apple',
    tags: ['macbook', 'apple', 'laptop', 'cao cấp'],
    stock: 25,
    rating: 4.9
  },
  {
    name: 'Dell XPS 15',
    description: 'Dell XPS 15 với Intel Core i7, 16GB RAM, 512GB SSD, màn hình 4K OLED',
    price: 42990000,
    originalPrice: 45990000,
    images: ['https://picsum.photos/400/400?random=4'],
    category: 'Laptop',
    brand: 'Dell',
    tags: ['dell', 'xps', 'laptop', 'cao cấp'],
    stock: 30,
    rating: 4.6
  },
  {
    name: 'iPad Pro 12.9 inch M2',
    description: 'iPad Pro 12.9 inch với chip M2, màn hình Liquid Retina XDR, hỗ trợ Apple Pencil 2',
    price: 29990000,
    originalPrice: 31990000,
    images: ['https://picsum.photos/400/400?random=5'],
    category: 'Tablet',
    brand: 'Apple',
    tags: ['ipad', 'apple', 'tablet', 'cao cấp'],
    stock: 35,
    rating: 4.8
  },
  {
    name: 'Samsung Galaxy Tab S9 Ultra',
    description: 'Samsung Galaxy Tab S9 Ultra với Snapdragon 8 Gen 2, màn hình 14.6 inch Dynamic AMOLED',
    price: 27990000,
    originalPrice: 29990000,
    images: ['https://picsum.photos/400/400?random=6'],
    category: 'Tablet',
    brand: 'Samsung',
    tags: ['samsung', 'tablet', 'galaxy'],
    stock: 20,
    rating: 4.5
  },
  {
    name: 'Apple Watch Ultra 2',
    description: 'Apple Watch Ultra 2 với màn hình 49mm, GPS + Cellular, pin 36 giờ',
    price: 21990000,
    originalPrice: 23990000,
    images: ['https://picsum.photos/400/400?random=7'],
    category: 'Đồng hồ',
    brand: 'Apple',
    tags: ['apple watch', 'smartwatch', 'cao cấp'],
    stock: 45,
    rating: 4.7
  },
  {
    name: 'AirPods Pro 2',
    description: 'AirPods Pro 2 với chip H2, chống ồn chủ động, âm thanh không gian',
    price: 6490000,
    originalPrice: 6990000,
    images: ['https://picsum.photos/400/400?random=8'],
    category: 'Phụ kiện',
    brand: 'Apple',
    tags: ['airpods', 'tai nghe', 'apple'],
    stock: 100,
    rating: 4.6
  },
  {
    name: 'Xiaomi 14 Pro',
    description: 'Xiaomi 14 Pro với Snapdragon 8 Gen 3, camera Leica, sạc nhanh 120W',
    price: 19990000,
    originalPrice: 21990000,
    images: ['https://picsum.photos/400/400?random=9'],
    category: 'Điện thoại',
    brand: 'Xiaomi',
    tags: ['xiaomi', 'flagship', 'leica'],
    stock: 60,
    rating: 4.5
  },
  {
    name: 'OPPO Find X7 Ultra',
    description: 'OPPO Find X7 Ultra với camera Hasselblad, Snapdragon 8 Gen 3',
    price: 24990000,
    originalPrice: 26990000,
    images: ['https://picsum.photos/400/400?random=10'],
    category: 'Điện thoại',
    brand: 'OPPO',
    tags: ['oppo', 'flagship', 'hasselblad'],
    stock: 40,
    rating: 4.4
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Favorite.deleteMany({});
    await ViewHistory.deleteMany({});
    await Comment.deleteMany({});
    await Order.deleteMany({});
    console.log('🗑️ Đã xóa dữ liệu cũ');

    // Create users
    const createdUsers = await User.create(users);
    console.log(`👥 Đã tạo ${createdUsers.length} users`);

    // Create products
    const createdProducts = await Product.create(products);
    console.log(`📦 Đã tạo ${createdProducts.length} sản phẩm`);

    // Create sample favorites
    const favorites = [];
    for (let i = 1; i < createdUsers.length; i++) {
      // Each user favorites 2-4 random products
      const numFavorites = Math.floor(Math.random() * 3) + 2;
      const shuffled = createdProducts.sort(() => 0.5 - Math.random());
      for (let j = 0; j < numFavorites; j++) {
        favorites.push({
          user: createdUsers[i]._id,
          product: shuffled[j]._id
        });
      }
    }
    await Favorite.create(favorites);
    console.log(`❤️ Đã tạo ${favorites.length} favorites`);

    // Create sample view history
    const viewHistory = [];
    for (let i = 1; i < createdUsers.length; i++) {
      const numViews = Math.floor(Math.random() * 5) + 3;
      const shuffled = createdProducts.sort(() => 0.5 - Math.random());
      for (let j = 0; j < numViews; j++) {
        viewHistory.push({
          user: createdUsers[i]._id,
          product: shuffled[j]._id,
          viewCount: Math.floor(Math.random() * 5) + 1
        });
      }
    }
    await ViewHistory.create(viewHistory);
    console.log(`👁️ Đã tạo ${viewHistory.length} view history`);

    // Create sample comments
    const commentTexts = [
      'Sản phẩm tuyệt vời, rất hài lòng!',
      'Chất lượng tốt, đóng gói cẩn thận',
      'Giao hàng nhanh, sản phẩm đúng mô tả',
      'Đáng đồng tiền bỏ ra',
      'Sẽ mua lại lần sau',
      'Pin trâu, màn hình đẹp',
      'Camera chụp rất nét',
      'Thiết kế sang trọng'
    ];

    const comments = [];
    for (let i = 1; i < createdUsers.length; i++) {
      const numComments = Math.floor(Math.random() * 3) + 1;
      const shuffled = createdProducts.sort(() => 0.5 - Math.random());
      for (let j = 0; j < numComments; j++) {
        comments.push({
          user: createdUsers[i]._id,
          product: shuffled[j]._id,
          content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
          isVerifiedPurchase: Math.random() > 0.5
        });
      }
    }
    await Comment.create(comments);
    console.log(`💬 Đã tạo ${comments.length} comments`);

    // Create sample orders
    const orders = [];
    for (let i = 1; i < createdUsers.length; i++) {
      const numOrders = Math.floor(Math.random() * 2) + 1;
      for (let k = 0; k < numOrders; k++) {
        const numItems = Math.floor(Math.random() * 2) + 1;
        const shuffled = createdProducts.sort(() => 0.5 - Math.random());
        const items = [];
        let total = 0;

        for (let j = 0; j < numItems; j++) {
          const qty = Math.floor(Math.random() * 2) + 1;
          items.push({
            product: shuffled[j]._id,
            name: shuffled[j].name,
            quantity: qty,
            price: shuffled[j].price
          });
          total += shuffled[j].price * qty;
        }

        orders.push({
          user: createdUsers[i]._id,
          items,
          shippingAddress: {
            fullName: createdUsers[i].name,
            phone: '0901234567',
            address: '123 Đường ABC',
            city: 'Hồ Chí Minh',
            district: 'Quận 1',
            ward: 'Phường Bến Nghé'
          },
          totalAmount: total,
          orderStatus: ['pending', 'confirmed', 'delivered'][Math.floor(Math.random() * 3)],
          paymentStatus: 'paid'
        });
      }
    }
    await Order.create(orders);
    console.log(`🛒 Đã tạo ${orders.length} orders`);

    // Update product stats
    for (const product of createdProducts) {
      const favoriteCount = await Favorite.countDocuments({ product: product._id });
      const commentCount = await Comment.countDocuments({ product: product._id });
      const commenters = await Comment.distinct('user', { product: product._id });
      const buyers = await Order.distinct('user', {
        'items.product': product._id,
        orderStatus: 'delivered'
      });

      await Product.findByIdAndUpdate(product._id, {
        favoriteCount,
        commentCount,
        buyerCount: buyers.length,
        numReviews: commenters.length
      });
    }
    console.log('📊 Đã cập nhật thống kê sản phẩm');

    console.log('\n✅ Seed data hoàn tất!');
    console.log('\n📋 Thông tin đăng nhập:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   User:  user1@example.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

seedDB();

