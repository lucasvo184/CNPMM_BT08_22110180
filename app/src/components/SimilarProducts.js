import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { productAPI } from '../services/api';
import ProductCard from './ProductCard';

const SimilarProducts = ({ productId, navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimilarProducts();
  }, [productId]);

  const loadSimilarProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getSimilarProducts(productId, 10);
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error loading similar products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF6B35" />
      </View>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sản phẩm tương tự</Text>
      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.push('ProductDetail', { productId: item._id })}
            showStats={true}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
});

export default SimilarProducts;

