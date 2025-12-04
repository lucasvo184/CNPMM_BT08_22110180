const Product = require('../models/Product');
const Favorite = require('../models/Favorite');
const ViewHistory = require('../models/ViewHistory');
const Order = require('../models/Order');
const Comment = require('../models/Comment');

// @desc    Lấy danh sách sản phẩm
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      brand, 
      minPrice, 
      maxPrice,
      search,
      sort = '-createdAt'
    } = req.query;
    
    const query = { isActive: true };
    
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }
    
    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
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

// @desc    Lấy chi tiết sản phẩm (kèm thống kê)
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Lấy thống kê chi tiết
    const buyerCount = await Order.countBuyers(product._id);
    const commentCount = await Comment.countDocuments({ product: product._id });
    const uniqueCommenters = await Comment.distinct('user', { product: product._id });
    
    // Kiểm tra user đã yêu thích chưa (nếu có đăng nhập)
    let isFavorited = false;
    if (req.user) {
      const favorite = await Favorite.findOne({ 
        user: req.user._id, 
        product: product._id 
      });
      isFavorited = !!favorite;
    }
    
    res.json({
      success: true,
      data: {
        ...product.toObject(),
        stats: {
          viewCount: product.viewCount,
          favoriteCount: product.favoriteCount,
          buyerCount: buyerCount,
          commentCount: commentCount,
          commenterCount: uniqueCommenters.length
        },
        isFavorited
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

// @desc    Lấy sản phẩm tương tự
// @route   GET /api/products/:id/similar
// @access  Public
exports.getSimilarProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Tìm sản phẩm tương tự dựa trên:
    // 1. Cùng category
    // 2. Cùng brand
    // 3. Giá tương đương (±30%)
    // 4. Tags giống nhau
    const priceRange = {
      min: product.price * 0.7,
      max: product.price * 1.3
    };
    
    const similarProducts = await Product.aggregate([
      {
        $match: {
          _id: { $ne: product._id },
          isActive: true,
          $or: [
            { category: product.category },
            { brand: product.brand },
            { 
              price: { $gte: priceRange.min, $lte: priceRange.max }
            },
            { tags: { $in: product.tags } }
          ]
        }
      },
      {
        // Tính điểm tương đồng
        $addFields: {
          similarityScore: {
            $add: [
              { $cond: [{ $eq: ['$category', product.category] }, 3, 0] },
              { $cond: [{ $eq: ['$brand', product.brand] }, 2, 0] },
              { 
                $cond: [
                  { 
                    $and: [
                      { $gte: ['$price', priceRange.min] },
                      { $lte: ['$price', priceRange.max] }
                    ]
                  }, 
                  1, 
                  0
                ] 
              },
              {
                $size: {
                  $setIntersection: ['$tags', product.tags || []]
                }
              }
            ]
          }
        }
      },
      { $sort: { similarityScore: -1, rating: -1, viewCount: -1 } },
      { $limit: Number(limit) },
      { $project: { similarityScore: 0 } }
    ]);
    
    res.json({
      success: true,
      data: similarProducts,
      count: similarProducts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Tạo sản phẩm mới
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Cập nhật sản phẩm
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Lấy thống kê sản phẩm (số khách mua, khách bình luận)
// @route   GET /api/products/:id/stats
// @access  Public
exports.getProductStats = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Đếm số unique buyers (đã mua thành công)
    const buyers = await Order.distinct('user', {
      'items.product': productId,
      orderStatus: 'delivered'
    });
    
    // Đếm số unique commenters
    const commenters = await Comment.distinct('user', {
      product: productId
    });
    
    // Lấy danh sách recent buyers
    const recentBuyers = await Order.find({
      'items.product': productId,
      orderStatus: 'delivered'
    })
      .sort('-deliveredAt')
      .limit(5)
      .populate('user', 'name avatar');
    
    // Lấy danh sách recent commenters
    const recentCommenters = await Comment.find({ product: productId })
      .sort('-createdAt')
      .limit(5)
      .populate('user', 'name avatar');
    
    res.json({
      success: true,
      data: {
        productId,
        productName: product.name,
        viewCount: product.viewCount,
        favoriteCount: product.favoriteCount,
        buyerCount: buyers.length,
        commenterCount: commenters.length,
        totalComments: await Comment.countDocuments({ product: productId }),
        rating: product.rating,
        recentBuyers: recentBuyers.map(o => o.user),
        recentCommenters: recentCommenters.map(c => ({
          user: c.user,
          comment: c.content.substring(0, 50) + '...',
          rating: c.rating,
          createdAt: c.createdAt
        }))
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

