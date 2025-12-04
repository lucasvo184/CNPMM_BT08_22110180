const ViewHistory = require('../models/ViewHistory');
const Product = require('../models/Product');

// @desc    Lấy lịch sử sản phẩm đã xem
// @route   GET /api/view-history
// @access  Private
exports.getViewHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const viewHistory = await ViewHistory.find({ user: req.user._id })
      .sort('-viewedAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: 'product',
        select: 'name price originalPrice images rating category brand isActive'
      });
    
    const total = await ViewHistory.countDocuments({ user: req.user._id });
    
    // Lọc sản phẩm còn active
    const activeHistory = viewHistory.filter(h => h.product && h.product.isActive !== false);
    
    res.json({
      success: true,
      data: activeHistory.map(h => ({
        historyId: h._id,
        product: h.product,
        viewedAt: h.viewedAt,
        viewCount: h.viewCount
      })),
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

// @desc    Ghi nhận lượt xem sản phẩm
// @route   POST /api/view-history
// @access  Private
exports.recordView = async (req, res) => {
  try {
    const { productId } = req.body;
    
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Ghi nhận lượt xem
    const history = await ViewHistory.recordView(req.user._id, productId);
    
    res.json({
      success: true,
      message: 'Đã ghi nhận lượt xem',
      data: {
        historyId: history._id,
        productId: history.product,
        viewedAt: history.viewedAt,
        totalViews: history.viewCount
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

// @desc    Xóa một sản phẩm khỏi lịch sử xem
// @route   DELETE /api/view-history/:productId
// @access  Private
exports.removeFromHistory = async (req, res) => {
  try {
    const history = await ViewHistory.findOneAndDelete({
      user: req.user._id,
      product: req.params.productId
    });
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy trong lịch sử xem'
      });
    }
    
    res.json({
      success: true,
      message: 'Đã xóa khỏi lịch sử xem'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Xóa toàn bộ lịch sử xem
// @route   DELETE /api/view-history
// @access  Private
exports.clearHistory = async (req, res) => {
  try {
    await ViewHistory.deleteMany({ user: req.user._id });
    
    res.json({
      success: true,
      message: 'Đã xóa toàn bộ lịch sử xem'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Lấy sản phẩm đã xem gần đây
// @route   GET /api/view-history/recent
// @access  Private
exports.getRecentViewed = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentViewed = await ViewHistory.find({ user: req.user._id })
      .sort('-viewedAt')
      .limit(Number(limit))
      .populate({
        path: 'product',
        select: 'name price originalPrice images rating category'
      });
    
    const activeProducts = recentViewed
      .filter(h => h.product && h.product.isActive !== false)
      .map(h => h.product);
    
    res.json({
      success: true,
      data: activeProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

