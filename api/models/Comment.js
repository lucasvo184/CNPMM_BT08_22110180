const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung bình luận'],
    trim: true,
    maxlength: [1000, 'Bình luận không được quá 1000 ký tự']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  images: [{
    type: String
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Cập nhật số lượng comment và rating trung bình
commentSchema.post('save', async function() {
  await updateProductStats(this.product);
});

commentSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updateProductStats(doc.product);
  }
});

async function updateProductStats(productId) {
  const Product = mongoose.model('Product');
  const Comment = mongoose.model('Comment');
  
  const stats = await Comment.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        commentCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        uniqueUsers: { $addToSet: '$user' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      commentCount: stats[0].commentCount,
      rating: Math.round(stats[0].avgRating * 10) / 10 || 0,
      numReviews: stats[0].uniqueUsers.length
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      commentCount: 0,
      rating: 0,
      numReviews: 0
    });
  }
}

module.exports = mongoose.model('Comment', commentSchema);

