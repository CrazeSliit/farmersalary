import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, FlatList,
  StyleSheet, Alert, ActivityIndicator, Platform, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BarChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing   from 'expo-sharing';
import { COLORS } from '../constants/colors';
import { farmerApi, reportApi } from '../api/apiService';

const SCREEN_W = Dimensions.get('window').width;

// ── helpers ───────────────────────────────────────────────────────────────────

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fmtDisplay(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtRs(n) {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `Rs.${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `Rs.${(v / 1_000).toFixed(0)}K`;
  return `Rs.${v.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' });
}

function monthsInRange(from, to) {
  const months = [];
  const cur = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(),   to.getMonth(),   1);
  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

function lastDayOf(year, month) {
  return new Date(year, month + 1, 0);
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

// ── Farmer picker modal ───────────────────────────────────────────────────────

function FarmerPicker({ farmers, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = farmers.find(f => f.id === value);
  const label    = selected ? `${selected.name} (${selected.fmsNo})` : 'All Farmers';

  return (
    <>
      <TouchableOpacity style={styles.pickerTrigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.pickerTriggerText} numberOfLines={1}>{label}</Text>
        <MaterialIcons name="arrow-drop-down" size={22} color={COLORS.primary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity style={styles.pickerSheet} activeOpacity={1}>
            <Text style={styles.pickerSheetTitle}>Select Farmer</Text>

            <FlatList
              data={[{ id: null, name: 'All Farmers', fmsNo: '' }, ...farmers]}
              keyExtractor={item => String(item.id ?? 'all')}
              renderItem={({ item }) => {
                const isActive = item.id === value;
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, isActive && styles.pickerItemActive]}
                    onPress={() => { onChange(item.id); setOpen(false); }}
                  >
                    <Text style={[styles.pickerItemText, isActive && styles.pickerItemTextActive]}>
                      {item.id ? `${item.name}  (${item.fmsNo})` : 'All Farmers'}
                    </Text>
                    {isActive && <MaterialIcons name="check" size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              }}
              style={{ maxHeight: 320 }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── StatBox ───────────────────────────────────────────────────────────────────

function StatBox({ value, label, icon }) {
  return (
    <View style={styles.statBox}>
      <MaterialIcons name={icon} size={20} color={COLORS.primary} style={{ marginBottom: 4 }} />
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── screen ────────────────────────────────────────────────────────────────────

export default function ReportScreen() {
  const now         = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [fromDate,          setFromDate]          = useState(defaultFrom);
  const [toDate,            setToDate]            = useState(defaultTo);
  const [pendingFrom,       setPendingFrom]       = useState(defaultFrom);
  const [pendingTo,         setPendingTo]         = useState(defaultTo);
  const [selectedFarmerId,  setSelectedFarmerId]  = useState(null);
  const [farmers,           setFarmers]           = useState([]);
  const [reportData,        setReportData]        = useState(null);
  const [monthlyData,       setMonthlyData]       = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [exporting,         setExporting]         = useState(false);
  const [showFromPicker,    setShowFromPicker]    = useState(false);
  const [showToPicker,      setShowToPicker]      = useState(false);

  // Load farmers for dropdown
  useEffect(() => {
    farmerApi.getAll({ limit: 200 })
      .then(res => setFarmers(res.data?.farmers ?? res.data ?? []))
      .catch(() => {});
  }, []);

  // ── generate ───────────────────────────────────────────────────────────────

  async function handleGenerate() {
    setLoading(true);
    setFromDate(pendingFrom);
    setToDate(pendingTo);
    try {
      const params = {
        from:     toISO(pendingFrom),
        to:       toISO(pendingTo),
        ...(selectedFarmerId ? { farmerId: selectedFarmerId } : {}),
      };

      const summaryRes = await reportApi.getSummary(params);
      setReportData(summaryRes.data);

      // Monthly breakdown for chart
      const months = monthsInRange(pendingFrom, pendingTo);
      const monthly = await Promise.all(
        months.map(async ({ year, month }) => {
          const mFrom = new Date(year, month, 1);
          const mTo   = lastDayOf(year, month);
          const mRes  = await reportApi.getSummary({
            from:     toISO(mFrom),
            to:       toISO(mTo),
            ...(selectedFarmerId ? { farmerId: selectedFarmerId } : {}),
          });
          return { label: monthLabel(year, month), litres: mRes.data?.totalLitres ?? 0 };
        })
      );
      setMonthlyData(monthly);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── CSV export ─────────────────────────────────────────────────────────────

  async function handleExportCSV() {
    if (!reportData) return;
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) { Alert.alert('Sharing not available on this device'); return; }

    setExporting(true);
    try {
      const header = 'Farmer,FMS No,Total Litres,Total Rs.\n';
      const rows   = (reportData.farmerBreakdown ?? [])
        .map(f => `"${f.name}","${f.fmsNo}",${f.totalLitres},${f.totalRupees}`)
        .join('\n');
      const csv = header + rows;

      const path = FileSystem.cacheDirectory + `report_${toISO(fromDate)}_${toISO(toDate)}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });

      await Sharing.shareAsync(path, {
        mimeType: 'text/csv',
        dialogTitle: `Report ${toISO(fromDate)} – ${toISO(toDate)}`,
      });
    } catch (err) {
      if (!err.message?.includes('cancel')) Alert.alert('Export failed', err.message);
    } finally {
      setExporting(false);
    }
  }

  // ── chart config ───────────────────────────────────────────────────────────

  const chartData = monthlyData.length > 0
    ? {
        labels:   monthlyData.map(m => m.label),
        datasets: [{ data: monthlyData.map(m => Math.max(m.litres, 0)) }],
      }
    : null;

  const chartConfig = {
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo:   COLORS.surface,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: () => COLORS.textSecondary,
    barPercentage: 0.6,
    decimalPlaces: 0,
    propsForLabels: { fontSize: 11 },
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* App bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Reports</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Filters */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PERIOD</Text>

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.filterLabel}>FROM</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={toISO(pendingFrom)}
                  onChange={(e) => { if (e.target.value) setPendingFrom(parseLocalDate(e.target.value)); }}
                  style={webDateInputStyle}
                />
              ) : (
                <TouchableOpacity style={styles.datePill} onPress={() => setShowFromPicker(true)}>
                  <Text style={styles.datePillText}>{fmtDisplay(pendingFrom)}</Text>
                  <MaterialIcons name="calendar-today" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.dateField}>
              <Text style={styles.filterLabel}>TO</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={toISO(pendingTo)}
                  onChange={(e) => { if (e.target.value) setPendingTo(parseLocalDate(e.target.value)); }}
                  style={webDateInputStyle}
                />
              ) : (
                <TouchableOpacity style={styles.datePill} onPress={() => setShowToPicker(true)}>
                  <Text style={styles.datePillText}>{fmtDisplay(pendingTo)}</Text>
                  <MaterialIcons name="calendar-today" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={[styles.filterLabel, { marginTop: 10, marginBottom: 4 }]}>FARMER</Text>
          <FarmerPicker
            farmers={farmers}
            value={selectedFarmerId}
            onChange={setSelectedFarmerId}
          />

          <TouchableOpacity
            style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <>
                  <MaterialIcons name="bar-chart" size={18} color={COLORS.white} />
                  <Text style={styles.generateBtnText}>Generate</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* Date pickers — native only */}
        {Platform.OS !== 'web' && showFromPicker && (
          <DateTimePicker
            value={pendingFrom}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => { setShowFromPicker(Platform.OS === 'ios'); if (date) setPendingFrom(date); }}
          />
        )}
        {Platform.OS !== 'web' && showToPicker && (
          <DateTimePicker
            value={pendingTo}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => { setShowToPicker(Platform.OS === 'ios'); if (date) setPendingTo(date); }}
          />
        )}

        {/* Results */}
        {reportData && (
          <>
            {/* Summary boxes */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>SUMMARY</Text>
              <View style={styles.statRow}>
                <StatBox
                  icon="people"
                  value={String(reportData.totalFarmers ?? 0)}
                  label="Farmers"
                />
                <StatBox
                  icon="water-drop"
                  value={`${Number(reportData.totalLitres ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} L`}
                  label="Milk"
                />
                <StatBox
                  icon="payments"
                  value={fmtRs(reportData.totalRupees)}
                  label="Payments"
                />
              </View>
              <View style={styles.statRow2}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatLabel}>Avg FAT</Text>
                  <Text style={styles.miniStatValue}>{Number(reportData.avgFat ?? 0).toFixed(2)} %</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatLabel}>Avg SNF</Text>
                  <Text style={styles.miniStatValue}>{Number(reportData.avgSnf ?? 0).toFixed(2)} %</Text>
                </View>
              </View>
            </View>

            {/* Monthly chart */}
            {chartData && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>MONTHLY MILK VOLUME (LITRES)</Text>
                {Platform.OS === 'web' ? (
                  <WebBarChart data={chartData} />
                ) : (
                  <BarChart
                    data={chartData}
                    width={SCREEN_W - 48}
                    height={200}
                    chartConfig={chartConfig}
                    style={{ borderRadius: 8, marginTop: 8 }}
                    fromZero
                    showValuesOnTopOfBars
                    withInnerLines={false}
                  />
                )}
              </View>
            )}

            {/* Top farmers */}
            {(reportData.farmerBreakdown ?? []).length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>TOP FARMERS — THIS PERIOD</Text>
                {reportData.farmerBreakdown.slice(0, 10).map((f, i) => (
                  <View key={f.id} style={[styles.rankRow, i > 0 && styles.rankRowBorder]}>
                    <View style={[styles.rankBadge, i < 3 && styles.rankBadgeTop]}>
                      <Text style={[styles.rankNum, i < 3 && styles.rankNumTop]}>{i + 1}</Text>
                    </View>
                    <View style={styles.rankInfo}>
                      <Text style={styles.rankName}>{f.name}</Text>
                      <Text style={styles.rankFms}>FMS {f.fmsNo}</Text>
                    </View>
                    <View style={styles.rankStats}>
                      <Text style={styles.rankLitres}>{Number(f.totalLitres).toFixed(1)} L</Text>
                      <Text style={styles.rankRupees}>
                        Rs. {Number(f.totalRupees).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Export CSV */}
            <TouchableOpacity
              style={[styles.exportBtn, exporting && styles.generateBtnDisabled]}
              onPress={handleExportCSV}
              disabled={exporting}
              activeOpacity={0.85}
            >
              {exporting
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <>
                    <MaterialIcons name="file-download" size={20} color={COLORS.primary} />
                    <Text style={styles.exportBtnText}>Export CSV</Text>
                  </>
              }
            </TouchableOpacity>
          </>
        )}

        {/* Empty state before first generate */}
        {!reportData && !loading && (
          <View style={styles.emptyState}>
            <MaterialIcons name="bar-chart" size={64} color={COLORS.textDisabled} />
            <Text style={styles.emptyText}>Set filters and tap Generate</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const webDateInputStyle = {
  border: `1px solid ${COLORS.primary}`,
  borderRadius: 6,
  padding: '7px 10px',
  fontSize: 13,
  color: COLORS.primary,
  fontWeight: '600',
  cursor: 'pointer',
  fontFamily: 'inherit',
  outline: 'none',
  backgroundColor: 'transparent',
  width: '100%',
  boxSizing: 'border-box',
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },

  appBar: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  appBarTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },

  scrollContent: { padding: 14, paddingBottom: 32 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Date filter
  dateRow:   { flexDirection: 'row', gap: 10 },
  dateField: { flex: 1 },
  filterLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  datePillText: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  // Farmer picker
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: COLORS.background,
  },
  pickerTriggerText: { flex: 1, fontSize: 14, color: COLORS.text },

  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerSheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pickerSheetTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  pickerItemActive:    { backgroundColor: COLORS.primaryPale },
  pickerItemText:      { flex: 1, fontSize: 14, color: COLORS.text },
  pickerItemTextActive:{ color: COLORS.primary, fontWeight: '700' },

  // Generate button
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 11,
    marginTop: 12,
    gap: 6,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  // Stat boxes
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.primaryPale,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginTop: 2 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  statRow2: { flexDirection: 'row', gap: 8 },
  miniStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  miniStatLabel: { fontSize: 12, color: COLORS.textSecondary },
  miniStatValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },

  // Top farmers
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  rankRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: { backgroundColor: COLORS.primary },
  rankNum:    { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  rankNumTop: { color: COLORS.white },
  rankInfo:   { flex: 1 },
  rankName:   { fontSize: 14, fontWeight: '600', color: COLORS.text },
  rankFms:    { fontSize: 11, color: COLORS.textSecondary },
  rankStats:  { alignItems: 'flex-end' },
  rankLitres: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  rankRupees: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },

  // Export
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 13,
    gap: 8,
    backgroundColor: COLORS.surface,
    marginBottom: 4,
  },
  exportBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText:  { fontSize: 15, color: COLORS.textSecondary },
});
