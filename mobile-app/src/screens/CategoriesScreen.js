import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { categoriesAPI } from '../services/api';
import { API_BASE } from '../config';
import { colors, borderRadius, shadows } from '../theme';

export default function CategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await categoriesAPI.getAll();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }) => {
    const imgUrl = item.image ? `${API_BASE}${item.image}` : null;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Products', { categoryId: item.id })}
        activeOpacity={0.8}
      >
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}
        <View style={styles.overlay} />
        <Text style={styles.name}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>الفئات</Text>
        <Text style={styles.subtitle}>تصفح حسب التصنيف</Text>
      </View>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.white, textAlign: 'right' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'right' },
  list: { padding: 16, paddingTop: 20, paddingBottom: 100 },
  row: { justifyContent: 'flex-end', gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    maxWidth: '48%',
    height: 150,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.card,
  },
  image: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: colors.borderLight },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  name: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    left: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
});
