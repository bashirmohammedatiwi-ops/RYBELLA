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
import { brandsAPI } from '../services/api';
import { API_BASE } from '../config';

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
        <ActivityIndicator size="large" color="#C2185B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>العلامات التجارية</Text>
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
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 20, textAlign: 'right', color: '#1a1a1a' },
  list: { padding: 16, paddingBottom: 100 },
  row: { justifyContent: 'flex-end', gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logo: { width: 80, height: 80 },
  placeholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 28, color: '#999', fontWeight: 'bold' },
  name: { marginTop: 10, fontSize: 14, color: '#333', textAlign: 'center' },
});
