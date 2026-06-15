import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { reportApi, farmerApi } from '../api/apiService';
import FarmerCard from '../components/FarmerCard';

function StatCard({ title, value, icon, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <MaterialIcons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function formatLitres(l = 0) {
  return `${Number(l).toLocaleString()} L`;
}

function formatPayment(p = 0) {
  if (p >= 1_000_000) return `Rs.${(p / 1_000_000).toFixed(1)}M`;
  if (p >= 1_000)     return `Rs.${(p / 1_000).toFixed(0)}k`;
  return `Rs.${p.toFixed(0)}`;
}

const QUICK_ACTIONS = [
  { key: 'add_farmer',  icon: 'person-add', label: 'Add Farmer', screen: 'FarmerRegister', params: undefined },
  { key: 'add_entry',   icon: 'water-drop', label: 'Add Entry',  screen: 'Farmers',        params: undefined },
  { key: 'reports',     icon: 'bar-chart',  label: 'Reports',    screen: 'Reports',         params: undefined },
  { key: 'payment',     icon: 'receipt',    label: 'Payment',    screen: 'Farmers',         params: { mode: 'payment' } },
];

export default function HomeScreen({ navigation }) {
  const [stats,         setStats]         = useState({});
  const [recentFarmers, setRecentFarmers] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [statsRes, farmersRes] = await Promise.all([
        reportApi.getDashboardStats(),
        farmerApi.getAll({ limit: 5, sort: 'createdAt', order: 'desc' }),
      ]);
      setStats(statsRes.data ?? {});
      setRecentFarmers(farmersRes.data ?? []);
    } catch (err) {
      console.warn('Dashboard load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  useFocusEffect(useCallback(() => { loadData(true); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleQuickAction = (action) => {
    if (action.screen === 'Reports') {
      navigation.navigate('Reports');
    } else {
      navigation.navigate(action.screen, action.params);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>Highland Farmers Salary</Text>
            <Text style={styles.headerSub}>Welcome back!</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="settings" size={26} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* ── This Month Stats ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>THIS MONTH</Text>
        <View style={styles.statsRow}>
          <StatCard
            title="Farmers"
            value={stats.totalFarmers ?? 0}
            icon="people"
            color={COLORS.primary}
          />
          <StatCard
            title="Milk"
            value={formatLitres(stats.monthlyLitres)}
            icon="water-drop"
            color={COLORS.secondary}
          />
          <StatCard
            title="Paid"
            value={formatPayment(stats.monthlyPayment)}
            icon="payments"
            color="#6A1B9A"
          />
        </View>
      </View>

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.actionBtn}
              onPress={() => handleQuickAction(action)}
              activeOpacity={0.75}
            >
              <MaterialIcons name={action.icon} size={30} color={COLORS.primary} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Recent Farmers ──────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>RECENT FARMERS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Farmers')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentFarmers.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="people-outline" size={36} color={COLORS.border} />
            <Text style={styles.emptyText}>No farmers registered yet.</Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={() => navigation.navigate('FarmerRegister')}
            >
              <Text style={styles.emptyActionText}>Register First Farmer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentFarmers.map((farmer) => (
            <FarmerCard
              key={farmer.id}
              farmer={farmer}
              onPress={() => navigation.navigate('FarmerDetail', { farmerId: farmer.id })}
              showActions={false}
              compact
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { paddingBottom: 24 },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerLogo:  { width: 44, height: 44, borderRadius: 8 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },

  // Section
  section:       { marginTop: 16, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel:  { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.8, marginBottom: 10 },
  seeAll:        { fontSize: 13, color: COLORS.secondary, fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: { fontSize: 16, fontWeight: 'bold', marginTop: 6, marginBottom: 2 },
  statTitle: { fontSize: 11, color: COLORS.textSecondary },

  // Quick Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    width: '47.5%',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  // Empty state
  emptyBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText:       { fontSize: 14, color: COLORS.textSecondary },
  emptyAction:     { marginTop: 4, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: COLORS.primaryPale, borderRadius: 6 },
  emptyActionText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
});
