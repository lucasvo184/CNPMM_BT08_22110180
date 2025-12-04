const Favorite = require('../models/Favorite');
const Product = require('../models/Product');

// @desc    Lấy danh sách sản phẩm yêu thích của user
// @route   GET /api/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const favorites = await Favorite.find({ user: req.user._id })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: 'product',
        select: 'name price originalPrice images rating numReviews category brand favoriteCount'
      });
    
    const total = await Favorite.countDocuments({ user: req.user._id });
    
    // Lọc ra những sản phẩm còn active
    const activeFavorites = favorites.filter(f => f.product && f.product.isActive !== false);
    
    res.json({
      success: true,
      data: activeFavorites.map(f => ({
        favoriteId: f._id,
        product: f.product,
        addedAt: f.createdAt
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

// @desc    Thêm sản phẩm vào yêu thích
// @route   POST /api/favorites
// @access  Private
exports.addFavorite = async (req, res) => {
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
    
    // Kiểm tra đã yêu thích chưa
    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      product: productId
    });
    
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm đã có trong danh sách yêu thích'
      });
    }
    
    const favorite = await Favorite.create({
      user: req.user._id,
      product: productId
    });
    
    // Populate product info
    await favorite.populate({
      path: 'product',
      select: 'name price images rating favoriteCount'
    });
    
    res.status(201).json({
      success: true,
      message: 'Đã thêm vào danh sách yêu thích',
      data: {
        favoriteId: favorite._id,
        product: favorite.product,
        addedAt: favorite.createdAt
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

// @desc    Xóa sản phẩm khỏi yêu thích
// @route   DELETE /api/favorites/:productId
// @access  Private
exports.removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      product: req.params.productId
    });
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy trong danh sách yêu thích'
      });
    }
    
    res.json({
      success: true,
      message: 'Đã xóa khỏi danh sách yêu thích'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Toggle yêu thích (thêm/xóa)
// @route   POST /api/favorites/toggle/:productId
// @access  Private
exports.toggleFavorite = async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      product: productId
    });
    
    if (existingFavorite) {
      // Xóa khỏi yêu thích
      await Favorite.findOneAndDelete({
        user: req.user._id,
        product: productId
      });
      
      const newCount = await Favorite.countDocuments({ product: productId });
      await Product.findByIdAndUpdate(productId, { favoriteCount: newCount });
      
      res.json({
        success: true,
        message: 'Đã xóa khỏi danh sách yêu thích',
        data: {
          isFavorited: false,
          favoriteCount: newCount
        }
      });
    } else {
      // Thêm vào yêu thích
      await Favorite.create({
        user: req.user._id,
        product: productId
      });
      
      const newCount = await Favorite.countDocuments({ product: productId });
      await Product.findByIdAndUpdate(productId, { favoriteCount: newCount });
      
      res.json({
        success: true,
        message: 'Đã thêm vào danh sách yêu thích',
        data: {
          isFavorited: true,
          favoriteCount: newCount
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Kiểm tra sản phẩm có trong yêu thích không
// @route   GET /api/favorites/check/:productId
// @access  Private
exports.checkFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      user: req.user._id,
      product: req.params.productId
    });
    
    res.json({
      success: true,
      data: {
        isFavorited: !!favorite,
        favoriteId: favorite ? favorite._id : null
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

