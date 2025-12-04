const mongoose = require('mongoose');

const viewHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  viewCount: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Đảm bảo mỗi user chỉ có 1 record cho mỗi sản phẩm
viewHistorySchema.index({ user: 1, product: 1 }, { unique: true });

// Static method để ghi nhận lượt xem
viewHistorySchema.statics.recordView = async function(userId, productId) {
  const Product = mongoose.model('Product');
  
  // Upsert: tạo mới hoặc cập nhật
  const result = await this.findOneAndUpdate(
    { user: userId, product: productId },
    { 
      $set: { viewedAt: new Date() },
      $inc: { viewCount: 1 }
    },
    { upsert: true, new: true }
  );
  
  // Tăng tổng lượt xem của sản phẩm
  await Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } });
  
  return result;
};

module.exports = mongoose.model('ViewHistory', viewHistorySchema);

