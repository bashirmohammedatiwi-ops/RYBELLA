import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { categoriesAPI } from '../services/api';
import { API_BASE } from '../config';
import { colors, borderRadius, shadows, gradients } from '../theme';

function CategoryCard({ item, imgUrl, index, onPress }) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ flex: 1, maxWidth: '48%', transform: [{ scale }], opacity }}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <LinearGradient colors={gradients.light} style={[styles.image, styles.placeholder]} />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.overlay} />
        <Text style={styles.name}>{item.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

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

  const renderCategory = ({ item, index }) => {
    const imgUrl = item.image ? `${API_BASE}${item.image}` : null;
    return (
      <CategoryCard
        item={item}
        imgUrl={imgUrl}
        index={index}
        onPress={() => navigation.navigate('Products', { categoryId: item.id })}
      />
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={gradients.light} style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.primarySoft }]}>
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
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'right' },
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
