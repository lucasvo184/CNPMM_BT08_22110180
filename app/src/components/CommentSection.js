import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { commentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CommentSection = ({ productId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState({});

  useEffect(() => {
    loadComments();
  }, [productId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentAPI.getProductComments(productId);
      setComments(response.data.data);
      setRatingDistribution(response.data.ratingDistribution);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung bình luận');
      return;
    }

    try {
      setSubmitting(true);
      await commentAPI.addComment(productId, newComment, rating);
      setNewComment('');
      setRating(5);
      loadComments();
      Alert.alert('Thành công', 'Đã thêm bình luận');
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thêm bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await commentAPI.likeComment(commentId);
      setComments(comments.map(c => 
        c._id === commentId 
          ? { ...c, likes: response.data.data.isLiked 
              ? [...c.likes, user._id] 
              : c.likes.filter(id => id !== user._id) }
          : c
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const renderStars = (count, onPress, size = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Ionicons
              name={star <= count ? 'star' : 'star-outline'}
              size={size}
              color="#FFD700"
              style={{ marginRight: 2 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Image
          source={{ uri: item.user?.avatar || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={styles.commentInfo}>
          <Text style={styles.userName}>{item.user?.name || 'Ẩn danh'}</Text>
          <View style={styles.commentMeta}>
            {renderStars(item.rating)}
            {item.isVerifiedPurchase && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#2ecc71" />
                <Text style={styles.verifiedText}>Đã mua hàng</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.commentDate}>
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>
      
      <Text style={styles.commentContent}>{item.content}</Text>
      
      <TouchableOpacity 
        style={styles.likeButton}
        onPress={() => handleLikeComment(item._id)}
      >
        <Ionicons 
          name={item.likes?.includes(user?._id) ? 'heart' : 'heart-outline'} 
          size={16} 
          color={item.likes?.includes(user?._id) ? '#e74c3c' : '#666'} 
        />
        <Text style={styles.likeCount}>{item.likes?.length || 0}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Đánh giá & Bình luận</Text>
      
      {/* Rating Summary */}
      <View style={styles.ratingSummary}>
        {[5, 4, 3, 2, 1].map((star) => (
          <View key={star} style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>{star}</Text>
            <Ionicons name="star" size={12} color="#FFD700" />
            <View style={styles.ratingBarContainer}>
              <View 
                style={[
                  styles.ratingBar, 
                  { 
                    width: `${(ratingDistribution[star] || 0) / 
                      Math.max(Object.values(ratingDistribution).reduce((a, b) => a + b, 0), 1) * 100}%` 
                  }
                ]} 
              />
            </View>
            <Text style={styles.ratingCount}>{ratingDistribution[star] || 0}</Text>
          </View>
        ))}
      </View>

      {/* Add Comment */}
      <View style={styles.addCommentSection}>
        <Text style={styles.addCommentTitle}>Viết đánh giá</Text>
        <View style={styles.ratingSelector}>
          <Text style={styles.ratingLabel}>Đánh giá: </Text>
          {renderStars(rating, setRating, 24)}
        </View>
        <TextInput
          style={styles.commentInput}
          placeholder="Nhập bình luận của bạn..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitComment}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Comments List */}
      {loading ? (
        <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 20 }} />
      ) : comments.length === 0 ? (
        <Text style={styles.noComments}>Chưa có bình luận nào</Text>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  ratingSummary: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  ratingLabel: {
    width: 20,
    fontSize: 12,
    color: '#666',
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  ratingCount: {
    width: 30,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  addCommentSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    marginBottom: 16,
  },
  addCommentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  ratingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  commentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  commentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 11,
    color: '#2ecc71',
    marginLeft: 2,
  },
  commentDate: {
    fontSize: 11,
    color: '#999',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    lineHeight: 20,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  likeCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  noComments: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
});

export default CommentSection;

