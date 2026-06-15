import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/colors';
import { milkEntryApi, paymentApi } from '../api/apiService';
import { calculateTotals } from '../utils/calculations';
import ConfirmModal from '../components/ConfirmModal';
import MilkEntryRow from '../components/MilkEntryRow';

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

function fmtRs(n) {
  return `Rs. ${Number(n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── screen ────────────────────────────────────────────────────────────────────

export default function MilkEntryListScreen({ navigation, route }) {
  const { farmerId, farmerName, fmsNo } = route.params ?? {};

  const now         = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo   = new Date(now.getFullYear(), now.getMonth(), 15);

  const [entries,        setEntries]        = useState([]);
  const [fromDate,       setFromDate]       = useState(defaultFrom);
  const [toDate,         setToDate]         = useState(defaultTo);
  const [pendingFrom,    setPendingFrom]    = useState(defaultFrom);
  const [pendingTo,      setPendingTo]      = useState(defaultTo);
  const [totals,         setTotals]         = useState({});
  const [loading,        setLoading]        = useState(true);
  const [generating,     setGenerating]     = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker,   setShowToPicker]   = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleting,       setDeleting]       = useState(false);
  const [cattleFeed,     setCattleFeed]     = useState('');
  const [cattleMedicine, setCattleMedicine] = useState('');

  // ── data ──────────────────────────────────────────────────────────────────

  const loadEntries = useCallback(async (from, to) => {
    setLoading(true);
    try {
      const res  = await milkEntryApi.getByFarmer(farmerId, { from: toISO(from), to: toISO(to) });
      const data = res.data?.entries ?? res.data ?? [];
      setEntries(data);
      setTotals(calculateTotals(data));
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [farmerId]);

  useFocusEffect(useCallback(() => {
    loadEntries(fromDate, toDate);
  }, [loadEntries, fromDate, toDate]));

  // ── actions ───────────────────────────────────────────────────────────────

  function applyFilter() {
    // Update committed dates — useFocusEffect will re-run via fromDate/toDate change.
    // Only trigger directly if dates actually changed to avoid double fetch.
    if (
      pendingFrom.getTime() !== fromDate.getTime() ||
      pendingTo.getTime()   !== toDate.getTime()
    ) {
      setFromDate(pendingFrom);
      setToDate(pendingTo);
    } else {
      loadEntries(fromDate, toDate);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await milkEntryApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      await loadEntries(fromDate, toDate);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleGenerate() {
    if (entries.length === 0) return;
    setGenerating(true);
    try {
      const res = await paymentApi.generate({
        farmerId,
        periodStart:   toISO(fromDate),
        periodEnd:     toISO(toDate),
        cattleFeed:    cattleFeed    ? parseFloat(cattleFeed)    : 0,
        cattleMedicine: cattleMedicine ? parseFloat(cattleMedicine) : 0,
      });
      navigation.navigate('PaymentAdvice', { paymentId: res.data.id });
    } catch (err) {
      Alert.alert('Cannot Generate', err.message);
    } finally {
      setGenerating(false);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerName} numberOfLines={1}>{farmerName}</Text>
          {fmsNo ? <Text style={styles.headerFms}>FMS: {fmsNo}</Text> : null}
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('MilkEntry', { farmerId, farmerName })}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="add" size={26} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Date filter */}
      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>FROM</Text>
        <TouchableOpacity style={styles.datePill} onPress={() => setShowFromPicker(true)}>
          <Text style={styles.datePillText}>{fmtDisplay(pendingFrom)}</Text>
          <MaterialIcons name="calendar-today" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <Text style={styles.filterLabel}>TO</Text>
        <TouchableOpacity style={styles.datePill} onPress={() => setShowToPicker(true)}>
          <Text style={styles.datePillText}>{fmtDisplay(pendingTo)}</Text>
          <MaterialIcons name="calendar-today" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.applyBtn} onPress={applyFilter}>
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>

      {/* Date pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={pendingFrom}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowFromPicker(Platform.OS === 'ios');
            if (date) setPendingFrom(date);
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={pendingTo}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowToPicker(Platform.OS === 'ios');
            if (date) setPendingTo(date);
          }}
        />
      )}

      {/* Table */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => String(item.id)}
          ListHeaderComponent={
            <View style={styles.tableWrap}>
              <MilkEntryRow isHeader onEdit={() => {}} onDelete={() => {}} />
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.tableWrap}>
              <MilkEntryRow
                entry={item}
                index={index}
                onEdit={() => navigation.navigate('MilkEntry', { farmerId, farmerName, entryId: item.id })}
                onDelete={() => setDeleteTarget(item)}
              />
            </View>
          )}
          ListFooterComponent={
            entries.length > 0
              ? (
                <Footer
                  totals={totals}
                  onGenerate={handleGenerate}
                  generating={generating}
                  cattleFeed={cattleFeed}
                  setCattleFeed={setCattleFeed}
                  cattleMedicine={cattleMedicine}
                  setCattleMedicine={setCattleMedicine}
                />
              ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="inbox" size={52} color={COLORS.textDisabled} />
              <Text style={styles.emptyText}>No entries for this period</Text>
              <Text style={styles.emptyHint}>Adjust the date range and tap Apply</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Entry?"
        message={deleteTarget
          ? `Receipt ${deleteTarget.receiptNo}  ·  ${Number(deleteTarget.litresKg).toFixed(2)} L`
          : ''}
        type="danger"
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

// ── Footer component ──────────────────────────────────────────────────────────

function Footer({ totals, onGenerate, generating, cattleFeed, setCattleFeed, cattleMedicine, setCattleMedicine }) {
  function fmtRs(n) {
    return `Rs. ${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const feedAmt     = parseFloat(cattleFeed)     || 0;
  const medicineAmt = parseFloat(cattleMedicine) || 0;
  const grossAmount = totals.totalRupees ?? 0;

  return (
    <>
      {/* Total row */}
      <View style={styles.tableWrap}>
        <MilkEntryRow isTotal entry={totals} onEdit={() => {}} onDelete={() => {}} />
      </View>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>SUMMARY</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Litres</Text>
          <Text style={styles.summaryValue}>{Number(totals.totalLitres ?? 0).toFixed(2)} L</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Average FAT</Text>
          <Text style={styles.summaryValue}>{Number(totals.avgFat ?? 0).toFixed(2)} %</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Average SNF</Text>
          <Text style={styles.summaryValue}>{Number(totals.avgSnf ?? 0).toFixed(2)} %</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelBold}>Gross Amount</Text>
          <Text style={styles.grossValue}>{fmtRs(grossAmount)}</Text>
        </View>

        {/* Deduction inputs */}
        <View style={styles.divider} />
        <Text style={styles.deductTitle}>DEDUCTIONS (Optional)</Text>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Cattle Feed</Text>
          <TextInput
            style={styles.deductInput}
            value={cattleFeed}
            onChangeText={setCattleFeed}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={COLORS.textDisabled}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Cattle Medicine</Text>
          <TextInput
            style={styles.deductInput}
            value={cattleMedicine}
            onChangeText={setCattleMedicine}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={COLORS.textDisabled}
          />
        </View>

        {(feedAmt > 0 || medicineAmt > 0) && (
          <>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Est. Net Amount</Text>
              <Text style={styles.grossValue}>{fmtRs(grossAmount - feedAmt - medicineAmt)}</Text>
            </View>
          </>
        )}
      </View>

      {/* Generate button */}
      <TouchableOpacity
        style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
        onPress={onGenerate}
        disabled={generating}
        activeOpacity={0.85}
      >
        {generating ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <>
            <MaterialIcons name="description" size={20} color={COLORS.white} />
            <Text style={styles.generateBtnText}>Generate Payment Advice</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  headerCenter: { flex: 1 },
  headerName:   { fontSize: 16, fontWeight: '700', color: COLORS.white },
  headerFms:    { fontSize: 12, color: COLORS.white + 'CC', marginTop: 1 },

  // Filter bar
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  datePillText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  applyBtn: {
    marginLeft: 'auto',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  applyBtnText: { fontSize: 13, color: COLORS.white, fontWeight: '700' },

  // Table
  tableWrap: { paddingHorizontal: 12, backgroundColor: COLORS.surface },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:  { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  emptyHint: { fontSize: 13, color: COLORS.textDisabled },

  // Summary card
  summaryCard: {
    margin: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel:     { fontSize: 14, color: COLORS.textSecondary },
  summaryLabelBold: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  summaryValue:     { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  grossValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },

  // Deduction inputs
  deductTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  inputLabel: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  deductInput: {
    width: 110,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'right',
    backgroundColor: COLORS.background,
  },

  // Generate button
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
