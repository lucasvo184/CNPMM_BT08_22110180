import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { viewHistoryAPI, favoriteAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

const ViewHistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState({});

  useEffect(() => {
    loadHistory();
  }, []);

  // Reload when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadHistory();
    });
    return unsubscribe;
  }, [navigation]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await viewHistoryAPI.getViewHistory();
      setHistory(response.data.data);
      
      // Load favorites status
      const favMap = {};
      for (const item of response.data.data) {
        try {
          const favRes = await favoriteAPI.checkFavorite(item.product._id);
          favMap[item.product._id] = favRes.data.data.isFavorited;
        } catch (e) {
          favMap[item.product._id] = false;
        }
      }
      setFavorites(favMap);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, []);

  const handleClearHistory = () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có muốn xóa toàn bộ lịch sử xem?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            try {
              await viewHistoryAPI.clearHistory();
              setHistory([]);
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa lịch sử');
            }
          }
        }
      ]
    );
  };

  const handleRemoveItem = async (productId) => {
    try {
      await viewHistoryAPI.removeFromHistory(productId);
      setHistory(history.filter(h => h.product._id !== productId));
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xóa khỏi lịch sử');
    }
  };

  const handleFavoritePress = async (productId) => {
    try {
      const response = await favoriteAPI.toggleFavorite(productId);
      setFavorites(prev => ({
        ...prev,
        [productId]: response.data.data.isFavorited
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleProductPress = async (product) => {
    try {
      await viewHistoryAPI.recordView(product._id);
    } catch (error) {
      console.error('Error recording view:', error);
    }
    navigation.navigate('ProductDetail', { productId: product._id });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xem';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <ProductCard
        product={item.product}
        onPress={() => handleProductPress(item.product)}
        onFavoritePress={() => handleFavoritePress(item.product._id)}
        isFavorited={favorites[item.product._id]}
      />
      <View style={styles.historyMeta}>
        <Text style={styles.viewedAt}>
          <Ionicons name="time-outline" size={12} color="#999" /> {formatDate(item.viewedAt)}
        </Text>
        <TouchableOpacity 
          onPress={() => handleRemoveItem(item.product._id)}
          style={styles.removeButton}
        >
          <Ionicons name="close" size={18} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="time" size={24} color="#FF6B35" />
          <Text style={styles.headerText}>
            {history.length} sản phẩm đã xem
          </Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={styles.clearText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="eye-off-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Chưa có lịch sử xem</Text>
          <Text style={styles.emptyText}>
            Các sản phẩm bạn đã xem sẽ xuất hiện ở đây
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>Khám phá sản phẩm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.historyId}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B35']}
            />
          }
        />
      )}
    </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  clearText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
  },
  listContent: {
    padding: 8,
  },
  historyItem: {
    flex: 1,
    maxWidth: '50%',
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    marginTop: -8,
  },
  viewedAt: {
    fontSize: 11,
    color: '#999',
  },
  removeButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 25,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ViewHistoryScreen;

