const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
}, {
  timestamps: true
});

// Đảm bảo mỗi user chỉ yêu thích 1 sản phẩm 1 lần
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });

// Cập nhật số lượng yêu thích khi thêm
favoriteSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  const count = await mongoose.model('Favorite').countDocuments({ product: this.product });
  await Product.findByIdAndUpdate(this.product, { favoriteCount: count });
});

// Cập nhật số lượng yêu thích khi xóa
favoriteSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Product = mongoose.model('Product');
    const count = await mongoose.model('Favorite').countDocuments({ product: doc.product });
    await Product.findByIdAndUpdate(doc.product, { favoriteCount: count });
  }
});

module.exports = mongoose.model('Favorite', favoriteSchema);

