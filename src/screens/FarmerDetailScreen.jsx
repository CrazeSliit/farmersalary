import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/colors';
import { farmerApi, milkEntryApi, paymentApi } from '../api/apiService';
import ConfirmModal from '../components/ConfirmModal';
import MilkEntryRow from '../components/MilkEntryRow';

const SCREEN_W = Dimensions.get('window').width;

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtPeriod(start, end) {
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

function fmtRs(n) {
  return `Rs. ${Number(n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Web bar chart fallback ────────────────────────────────────────────────────

function WebBarChart({ data }) {
  const values = data.datasets[0].data;
  const max = Math.max(...values, 1);
  return (
    <View style={{ marginTop: 8, gap: 6 }}>
      {data.labels.map((label, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ width: 36, fontSize: 11, color: COLORS.textSecondary, textAlign: 'right' }}>{label}</Text>
          <View style={{ flex: 1, height: 22, backgroundColor: COLORS.background, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: `${Math.max((values[i] / max) * 100, 2)}%`, height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 }} />
          </View>
          <Text style={{ width: 55, fontSize: 11, color: COLORS.text, fontWeight: '600' }}>{Number(values[i]).toFixed(1)} L</Text>
        </View>
      ))}
    </View>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

function TabBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function PaymentCard({ payment, onPress }) {
  const status = payment.status === 'PAID' ? 'PAID' : 'PENDING';
  const statusColor = status === 'PAID' ? COLORS.success : COLORS.warning;
  return (
    <TouchableOpacity style={styles.paymentCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.paymentCardTop}>
        <Text style={styles.paymentPeriod}>{fmtPeriod(payment.periodStart, payment.periodEnd)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>
      <View style={styles.paymentCardBottom}>
        <Text style={styles.paymentGross}>Gross: {fmtRs(payment.grossAmount)}</Text>
        <Text style={styles.paymentNet}>Net: {fmtRs(payment.netAmount)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── main screen ───────────────────────────────────────────────────────────────

export default function FarmerDetailScreen({ navigation, route }) {
  const { farmerId } = route.params;

  const [farmer,          setFarmer]          = useState(null);
  const [milkEntries,     setMilkEntries]     = useState([]);
  const [payments,        setPayments]        = useState([]);
  const [stats,           setStats]           = useState(null);
  const [activeTab,       setActiveTab]       = useState(0);
  const [loading,         setLoading]         = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting,        setDeleting]        = useState(false);

  // ── Load all data ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [fRes, eRes, pRes] = await Promise.all([
        farmerApi.getById(farmerId),
        milkEntryApi.getByFarmer(farmerId, { limit: 5 }),
        paymentApi.getByFarmer(farmerId),
      ]);

      setFarmer(fRes.data);

      const recent = eRes.data?.entries ?? eRes.data ?? [];
      setMilkEntries(recent);
      setPayments(pRes.data ?? []);

      // Fetch all entries to build stats
      const allRes = await milkEntryApi.getByFarmer(farmerId, { limit: 200 });
      const allEntries = allRes.data?.entries ?? allRes.data ?? [];
      buildStats(allEntries);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [farmerId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // ── Build monthly stats ───────────────────────────────────────────────────
  function buildStats(entries) {
    if (!entries.length) { setStats(null); return; }

    const byMonth = {};
    entries.forEach(e => {
      const key = e.date.slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { litres: 0, rupees: 0, fatSum: 0, snfSum: 0, count: 0 };
      byMonth[key].litres  += Number(e.litresKg ?? 0);
      byMonth[key].rupees  += Number(e.rupees   ?? 0);
      byMonth[key].fatSum  += Number(e.fat      ?? 0);
      byMonth[key].snfSum  += Number(e.snf      ?? 0);
      byMonth[key].count   += 1;
    });

    const months = Object.keys(byMonth).sort().slice(-6);

    const chartData = {
      labels: months.map(m => {
        const [yr, mo] = m.split('-');
        return new Date(Number(yr), Number(mo) - 1).toLocaleString('default', { month: 'short' });
      }),
      datasets: [{ data: months.map(m => Math.round(byMonth[m].litres * 10) / 10) }],
    };

    const latest = byMonth[months[months.length - 1]];
    const currentMonth = {
      totalLitres: latest.litres,
      avgFat:      latest.count ? latest.fatSum / latest.count : 0,
      avgSnf:      latest.count ? latest.snfSum / latest.count : 0,
      totalRupees: latest.rupees,
    };

    setStats({ chartData, currentMonth, label: months[months.length - 1] });
  }

  // ── Delete farmer ─────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await farmerApi.delete(farmerId);
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Delete Failed', err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Menu ──────────────────────────────────────────────────────────────────
  const handleMenu = () => {
    Alert.alert('Options', null, [
      {
        text: 'Edit Farmer',
        onPress: () => navigation.navigate('FarmerRegister', { farmerId }),
      },
      {
        text: 'Delete Farmer',
        style: 'destructive',
        onPress: () => setShowDeleteModal(true),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Delete entry inline ────────────────────────────────────────────────────
  const handleDeleteEntry = (entry) => {
    Alert.alert('Delete Entry', 'Delete this milk entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await milkEntryApi.delete(entry.id);
            loadData();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!farmer) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Farmer not found.</Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Custom Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{farmer.name}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('FarmerRegister', { farmerId })}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="edit" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleMenu}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginLeft: 12 }}
        >
          <MaterialIcons name="more-vert" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* ── Farmer Profile Card ─────────────────────────────────────────── */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarLetter}>{farmer.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.farmerName}>{farmer.name}</Text>
          <Text style={styles.fmsLabel}>FMS {farmer.fmsNo}</Text>
        </View>
      </View>

      <View style={styles.profileDetails}>
        <InfoRow icon="badge"           label="Registered Name" value={farmer.fmsName} />
        <InfoRow icon="location-on"     label="Address"         value={farmer.address} />
        {!!farmer.region      && <InfoRow icon="map"            label="Region"   value={farmer.region} />}
        {!!farmer.centre      && <InfoRow icon="place"          label="Centre"   value={farmer.centre} />}
        {!!farmer.bankAccount && (
          <InfoRow
            icon="account-balance"
            label="Bank A/C"
            value={`${farmer.bankAccount}${farmer.bankName ? ` — ${farmer.bankName}` : ''}`}
          />
        )}
      </View>

      {/* ── Tab Buttons ────────────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        <TabBtn label="Milk Entries" active={activeTab === 0} onPress={() => setActiveTab(0)} />
        <TabBtn label="Payments"     active={activeTab === 1} onPress={() => setActiveTab(1)} />
        <TabBtn label="Stats"        active={activeTab === 2} onPress={() => setActiveTab(2)} />
      </View>

      {/* ── Tab Content ────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.tabContentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab 0 — Milk Entries */}
        {activeTab === 0 && (
          <View>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('MilkEntry', { farmerId, farmerName: farmer.name })}
              activeOpacity={0.85}
            >
              <MaterialIcons name="add" size={18} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Add Milk Entry</Text>
            </TouchableOpacity>

            {milkEntries.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="water-drop" size={40} color={COLORS.border} />
                <Text style={styles.emptyText}>No milk entries yet.</Text>
              </View>
            ) : (
              <View style={styles.tableCard}>
                <MilkEntryRow isHeader onDelete={() => {}} />
                {milkEntries.map((e, i) => (
                  <MilkEntryRow
                    key={e.id}
                    entry={e}
                    index={i}
                    onEdit={() =>
                      navigation.navigate('MilkEntry', {
                        entryId: e.id,
                        farmerId,
                        farmerName: farmer.name,
                      })
                    }
                    onDelete={() => handleDeleteEntry(e)}
                  />
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() =>
                navigation.navigate('MilkEntryList', { farmerId, farmerName: farmer.name, fmsNo: farmer.fmsNo })
              }
            >
              <Text style={styles.viewAllText}>View All Entries</Text>
              <MaterialIcons name="chevron-right" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 1 — Payments */}
        {activeTab === 1 && (
          <View>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                navigation.navigate('MilkEntryList', { farmerId, farmerName: farmer.name, fmsNo: farmer.fmsNo })
              }
              activeOpacity={0.85}
            >
              <MaterialIcons name="receipt-long" size={18} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Generate Payment Advice</Text>
            </TouchableOpacity>

            {payments.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="payments" size={40} color={COLORS.border} />
                <Text style={styles.emptyText}>No payments generated yet.</Text>
              </View>
            ) : (
              payments.map(p => (
                <PaymentCard
                  key={p.id}
                  payment={p}
                  onPress={() => navigation.navigate('PaymentAdvice', { paymentId: p.id })}
                />
              ))
            )}
          </View>
        )}

        {/* Tab 2 — Stats */}
        {activeTab === 2 && (
          <View>
            {!stats ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="bar-chart" size={40} color={COLORS.border} />
                <Text style={styles.emptyText}>No data available for stats.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.chartTitle}>Monthly Litres Collected</Text>
                {Platform.OS === 'web' ? (
                  <WebBarChart data={stats.chartData} />
                ) : (
                  <BarChart
                    data={stats.chartData}
                    width={SCREEN_W - 32}
                    height={200}
                    yAxisSuffix=" L"
                    fromZero
                    showValuesOnTopOfBars
                    chartConfig={{
                      backgroundColor: COLORS.surface,
                      backgroundGradientFrom: COLORS.surface,
                      backgroundGradientTo: COLORS.surface,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                      labelColor: () => COLORS.textSecondary,
                      style: { borderRadius: 12 },
                    }}
                    style={styles.barChart}
                  />
                )}

                <Text style={styles.statsSectionTitle}>
                  Current Period — {stats.label}
                </Text>

                <View style={styles.statsGrid}>
                  <StatBox
                    label="Total Litres"
                    value={`${stats.currentMonth.totalLitres.toFixed(2)} L`}
                  />
                  <StatBox
                    label="Avg FAT"
                    value={`${stats.currentMonth.avgFat.toFixed(2)} %`}
                  />
                  <StatBox
                    label="Avg SNF"
                    value={`${stats.currentMonth.avgSnf.toFixed(2)} %`}
                  />
                  <StatBox
                    label="Total Rs."
                    value={`Rs. ${Math.round(stats.currentMonth.totalRupees).toLocaleString()}`}
                  />
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Delete Confirm Modal ────────────────────────────────────────── */}
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Farmer"
        message={`This will permanently delete ${farmer.name} and all their milk entries and payment history. This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
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
  errorText: { fontSize: 15, color: COLORS.textSecondary },

  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: COLORS.white },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  farmerName:   { fontSize: 16, fontWeight: '700', color: COLORS.text },
  fmsLabel:     { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  profileDetails: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.background,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, width: 110, marginRight: 4 },
  infoValue: { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: '500' },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn:         { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive:   { borderBottomColor: COLORS.primary },
  tabBtnText:     { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabBtnTextActive: { color: COLORS.primary },

  tabContent:      { flex: 1 },
  tabContentInner: { padding: 16, paddingBottom: 40 },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 10, height: 46, gap: 8,
    marginBottom: 16, elevation: 2,
  },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  tableCard: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 8,
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
  },

  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 4,
  },
  viewAllText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  emptyBox: { alignItems: 'center', paddingTop: 48, gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },

  paymentCard: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, elevation: 1,
  },
  paymentCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  paymentPeriod:  { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 },
  statusBadge:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:     { fontSize: 11, fontWeight: '700' },
  paymentCardBottom: { flexDirection: 'row', gap: 16 },
  paymentGross:      { fontSize: 13, color: COLORS.textSecondary },
  paymentNet:        { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  chartTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  barChart:   { borderRadius: 12, marginBottom: 20 },
  statsSectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary,
    marginBottom: 12, letterSpacing: 0.5,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    flex: 1, minWidth: '45%',
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, elevation: 1,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
});
