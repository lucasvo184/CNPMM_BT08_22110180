const Comment = require('../models/Comment');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Lấy danh sách bình luận của sản phẩm
// @route   GET /api/comments/product/:productId
// @access  Public
exports.getProductComments = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const productId = req.params.productId;
    
    const comments = await Comment.find({ product: productId })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'name avatar');
    
    const total = await Comment.countDocuments({ product: productId });
    
    // Thống kê rating
    const ratingStats = await Comment.aggregate([
      { $match: { product: require('mongoose').Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach(r => {
      if (r._id) ratingDistribution[r._id] = r.count;
    });
    
    res.json({
      success: true,
      data: comments,
      ratingDistribution,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Thêm bình luận
// @route   POST /api/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { productId, content, rating, images } = req.body;
    
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Kiểm tra user đã mua sản phẩm chưa
    const hasPurchased = await Order.hasUserPurchased(req.user._id, productId);
    
    const comment = await Comment.create({
      user: req.user._id,
      product: productId,
      content,
      rating,
      images,
      isVerifiedPurchase: hasPurchased
    });
    
    await comment.populate('user', 'name avatar');
    
    res.status(201).json({
      success: true,
      message: 'Thêm bình luận thành công',
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Cập nhật bình luận
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    const { content, rating, images } = req.body;
    
    let comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }
    
    // Kiểm tra quyền sở hữu
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa bình luận này'
      });
    }
    
    comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { content, rating, images },
      { new: true, runValidators: true }
    ).populate('user', 'name avatar');
    
    res.json({
      success: true,
      message: 'Cập nhật bình luận thành công',
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Xóa bình luận
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }
    
    // Kiểm tra quyền (owner hoặc admin)
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bình luận này'
      });
    }
    
    await Comment.findOneAndDelete({ _id: req.params.id });
    
    res.json({
      success: true,
      message: 'Xóa bình luận thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Like/Unlike bình luận
// @route   POST /api/comments/:id/like
// @access  Private
exports.toggleLikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }
    
    const likeIndex = comment.likes.indexOf(req.user._id);
    
    if (likeIndex > -1) {
      // Unlike
      comment.likes.splice(likeIndex, 1);
    } else {
      // Like
      comment.likes.push(req.user._id);
    }
    
    await comment.save();
    
    res.json({
      success: true,
      message: likeIndex > -1 ? 'Đã bỏ thích' : 'Đã thích bình luận',
      data: {
        isLiked: likeIndex === -1,
        likeCount: comment.likes.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Lấy bình luận của user
// @route   GET /api/comments/my-comments
// @access  Private
exports.getMyComments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const comments = await Comment.find({ user: req.user._id })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('product', 'name images price');
    
    const total = await Comment.countDocuments({ user: req.user._id });
    
    res.json({
      success: true,
      data: comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

