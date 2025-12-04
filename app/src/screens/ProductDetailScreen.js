import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { productAPI, favoriteAPI, viewHistoryAPI } from '../services/api';
import ProductStats from '../components/ProductStats';
import SimilarProducts from '../components/SimilarProducts';
import CommentSection from '../components/CommentSection';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      
      // Record view
      try {
        await viewHistoryAPI.recordView(productId);
      } catch (e) {
        console.log('View record failed:', e);
      }
      
      const response = await productAPI.getProduct(productId);
      setProduct(response.data.data);
      setIsFavorited(response.data.data.isFavorited || false);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin sản phẩm');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      const response = await favoriteAPI.toggleFavorite(productId);
      setIsFavorited(response.data.data.isFavorited);
      setProduct(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          favoriteCount: response.data.data.favoriteCount
        }
      }));
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật yêu thích');
    }
  };

  const formatPrice = (price) => {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!product) {
    return null;
  }

  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image Gallery */}
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
        >
          {(product.images?.length ? product.images : ['https://via.placeholder.com/400']).map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        {/* Image Indicators */}
        {product.images?.length > 1 && (
          <View style={styles.imageIndicators}>
            {product.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.indicatorActive
                ]}
              />
            ))}
          </View>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}

        {/* Favorite Button */}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={handleFavoriteToggle}
        >
          <Ionicons 
            name={isFavorited ? 'heart' : 'heart-outline'} 
            size={28} 
            color={isFavorited ? '#FF6B35' : '#666'} 
          />
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.category}>{product.category} • {product.brand}</Text>
        <Text style={styles.productName}>{product.name}</Text>
        
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={18} color="#FFD700" />
          <Text style={styles.rating}>{product.rating?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.reviews}>({product.numReviews || 0} đánh giá)</Text>
          <Text style={styles.sold}>• Đã bán: {product.stats?.buyerCount || 0}</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.originalPrice && product.originalPrice > product.price && (
            <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
          )}
        </View>

        {/* Stock Info */}
        <View style={styles.stockContainer}>
          <Ionicons 
            name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'} 
            size={18} 
            color={product.stock > 0 ? '#2ecc71' : '#e74c3c'} 
          />
          <Text style={[
            styles.stockText,
            { color: product.stock > 0 ? '#2ecc71' : '#e74c3c' }
          ]}>
            {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
          </Text>
        </View>
      </View>

      {/* Product Stats */}
      <ProductStats stats={product.stats} />

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
        <Text style={styles.description}>{product.description}</Text>
        
        {product.tags?.length > 0 && (
          <View style={styles.tagsContainer}>
            {product.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Similar Products */}
      <SimilarProducts productId={productId} navigation={navigation} />

      {/* Comments Section */}
      <CommentSection productId={productId} />

      {/* Bottom Spacing */}
      <View style={{ height: 100 }} />

      {/* Fixed Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatButton}>
          <Ionicons name="chatbubble-outline" size={24} color="#FF6B35" />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cartButton}>
          <Ionicons name="cart-outline" size={24} color="#FF6B35" />
          <Text style={styles.cartButtonText}>Thêm vào giỏ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyButtonText}>Mua ngay</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#fff',
  },
  productImage: {
    width: width,
    height: width,
    backgroundColor: '#f5f5f5',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#FF6B35',
    width: 20,
  },
  discountBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  favoriteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
  },
  category: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 28,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  rating: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  sold: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  price: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 10,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  stockText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  chatButton: {
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  chatButtonText: {
    fontSize: 11,
    color: '#FF6B35',
    marginTop: 2,
  },
  cartButton: {
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  cartButtonText: {
    fontSize: 11,
    color: '#FF6B35',
    marginTop: 2,
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 10,
    paddingVertical: 12,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen;

