const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    district: String,
    ward: String
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Banking', 'Momo', 'ZaloPay'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  note: String,
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String
}, {
  timestamps: true
});

// Cập nhật số người mua khi đơn hàng được giao thành công
orderSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.orderStatus === 'delivered') {
    const Product = mongoose.model('Product');
    const Order = mongoose.model('Order');
    
    for (const item of doc.items) {
      // Đếm số unique users đã mua sản phẩm này (đơn hàng delivered)
      const buyerCount = await Order.distinct('user', {
        'items.product': item.product,
        orderStatus: 'delivered'
      }).then(users => users.length);
      
      await Product.findByIdAndUpdate(item.product, { buyerCount });
    }
  }
});

// Static method để đếm số người mua
orderSchema.statics.countBuyers = async function(productId) {
  const buyers = await this.distinct('user', {
    'items.product': productId,
    orderStatus: 'delivered'
  });
  return buyers.length;
};

// Static method để kiểm tra user đã mua sản phẩm chưa
orderSchema.statics.hasUserPurchased = async function(userId, productId) {
  const order = await this.findOne({
    user: userId,
    'items.product': productId,
    orderStatus: 'delivered'
  });
  return !!order;
};

module.exports = mongoose.model('Order', orderSchema);

