import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProductStats = ({ stats }) => {
  const statItems = [
    { 
      icon: 'eye-outline', 
      label: 'Lượt xem', 
      value: stats?.viewCount || 0,
      color: '#3498db'
    },
    { 
      icon: 'heart-outline', 
      label: 'Yêu thích', 
      value: stats?.favoriteCount || 0,
      color: '#e74c3c'
    },
    { 
      icon: 'cart-outline', 
      label: 'Đã mua', 
      value: stats?.buyerCount || 0,
      color: '#2ecc71'
    },
    { 
      icon: 'chatbubble-outline', 
      label: 'Bình luận', 
      value: stats?.commenterCount || 0,
      color: '#9b59b6'
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thống kê sản phẩm</Text>
      <View style={styles.statsRow}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statItem}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 10,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
});

export default ProductStats;

