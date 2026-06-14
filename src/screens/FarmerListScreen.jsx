import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  RefreshControl, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { farmerApi } from '../api/apiService';
import FarmerCard from '../components/FarmerCard';
import ConfirmModal from '../components/ConfirmModal';

export default function FarmerListScreen({ navigation }) {
  const [farmers,         setFarmers]         = useState([]);
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFarmer,  setSelectedFarmer]  = useState(null);
  const [deleting,        setDeleting]        = useState(false);

  // ── Load ─────────────────────────────────────────────────────────
  const loadFarmers = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await farmerApi.getAll();
      setFarmers(res.data ?? []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadFarmers(); }, []);

  // Reload when navigating back from Register / Detail
  useFocusEffect(useCallback(() => { loadFarmers(true); }, []));

  // ── Local search filter ───────────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredFarmers(farmers);
    } else {
      setFilteredFarmers(
        farmers.filter(f =>
          f.name.toLowerCase().includes(q) ||
          f.fmsNo.toLowerCase().includes(q) ||
          (f.fmsName && f.fmsName.toLowerCase().includes(q))
        )
      );
    }
  }, [searchQuery, farmers]);

  // ── Delete ────────────────────────────────────────────────────────
  const handleDeletePress = (farmer) => {
    setSelectedFarmer(farmer);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFarmer) return;
    setDeleting(true);
    try {
      await farmerApi.delete(selectedFarmer.id);
      setShowDeleteModal(false);
      setSelectedFarmer(null);
      loadFarmers(true);
    } catch (err) {
      Alert.alert('Delete Failed', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedFarmer(null);
  };

  // ── Render ────────────────────────────────────────────────────────
  const renderFarmer = ({ item }) => (
    <FarmerCard
      farmer={item}
      onPress={() => navigation.navigate('FarmerDetail', { farmerId: item.id })}
      onEdit={() => navigation.navigate('FarmerRegister', { farmerId: item.id })}
      onDelete={() => handleDeletePress(item)}
      showActions
    />
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👥 Farmers</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{farmers.length}</Text>
        </View>
      </View>

      {/* ── Search Bar ──────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or FMS No..."
          placeholderTextColor={COLORS.textDisabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Farmer List ─────────────────────────────────────────── */}
      <FlatList
        data={filteredFarmers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderFarmer}
        contentContainerStyle={[
          styles.listContent,
          filteredFarmers.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadFarmers(true); }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="people-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No farmers match your search' : 'No Farmers Yet'}
            </Text>
            {!searchQuery && (
              <Text style={styles.emptyMsg}>Tap the + button to register your first farmer.</Text>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* ── FAB ─────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('FarmerRegister')}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* ── Delete Confirm Modal ─────────────────────────────────── */}
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Farmer"
        message={
          selectedFarmer
            ? `This will permanently delete ${selectedFarmer.name} and all their milk entries and payment history. This cannot be undone.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText="Delete"
        type="danger"
        loading={deleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white, flex: 1 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon:  { marginRight: 6 },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
  },

  // List
  listContent: { paddingHorizontal: 12, paddingBottom: 100 },
  listEmpty:   { flex: 1 },

  // Empty state
  emptyBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  emptyMsg:   { fontSize: 13, color: COLORS.textDisabled, textAlign: 'center', paddingHorizontal: 32 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
});
