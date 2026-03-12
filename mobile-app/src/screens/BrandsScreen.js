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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { brandsAPI } from '../services/api';
import { API_BASE } from '../config';
import { colors, borderRadius, shadows } from '../theme';

export default function BrandsScreen({ navigation }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const { data } = await brandsAPI.getAll();
      setBrands(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderBrand = ({ item }) => {
    const imgUrl = item.logo ? `${API_BASE}${item.logo}` : null;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Products', { brandId: item.id })}
        activeOpacity={0.8}
      >
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{item.name?.charAt(0)}</Text>
          </View>
        )}
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>العلامات التجارية</Text>
      </View>
      <FlatList
        data={brands}
        renderItem={renderBrand}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { padding: 8, marginLeft: 8 },
  title: { flex: 1, fontSize: 22, fontWeight: '700', textAlign: 'right', color: colors.white },
  list: { padding: 16, paddingBottom: 100 },
  row: { justifyContent: 'flex-end', gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    ...shadows.card,
  },
  logo: { width: 80, height: 80 },
  placeholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 28, color: colors.textMuted, fontWeight: 'bold' },
  name: { marginTop: 10, fontSize: 14, color: colors.text, textAlign: 'center' },
});
