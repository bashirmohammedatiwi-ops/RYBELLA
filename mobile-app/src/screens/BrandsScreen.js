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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, shadows, gradients, typography } from '../theme';

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
      <LinearGradient colors={gradients.light} style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.primarySoft }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <Icon name="arrow-forward" size={24} color={colors.text} />
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
    paddingTop: 48,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...shadows.soft,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  title: { flex: 1, ...typography.h2, textAlign: 'right', color: colors.text },
  list: { padding: 20, paddingBottom: 100 },
  row: { justifyContent: 'flex-end', gap: 14, marginBottom: 14 },
  card: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.06)',
  },
  logo: { width: 84, height: 84 },
  placeholder: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { ...typography.h1, fontSize: 28, color: colors.primary },
  name: { marginTop: 12, ...typography.caption, fontSize: 14, color: colors.text, textAlign: 'center' },
});
