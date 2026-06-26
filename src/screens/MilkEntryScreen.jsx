import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/colors';
import { milkEntryApi, settingsApi } from '../api/apiService';
import { calculateRate, calculateRupees } from '../utils/calculations';
import CustomInput from '../components/CustomInput';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDisplay(date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const EMPTY_FORM = {
  date:     new Date(),
  litresKg: '',
  fat:      '',
  snf:      '',
  rate:     '',
  rupees:   0,
};

// ── screen ────────────────────────────────────────────────────────────────────

export default function MilkEntryScreen({ navigation, route }) {
  const { farmerId, farmerName, entryId } = route.params ?? {};
  const isEditMode = !!entryId;

  const [formData,       setFormData]       = useState(EMPTY_FORM);
  const [errors,         setErrors]         = useState({});
  const [loading,        setLoading]        = useState(false);
  const [fetching,       setFetching]       = useState(isEditMode);
  const [settings,       setSettings]       = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [rateManual,     setRateManual]     = useState(false);

  // ── Set header title ───────────────────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({ title: isEditMode ? 'Edit Milk Entry' : 'Add Milk Entry' });
  }, [isEditMode]);

  // ── Load settings ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await settingsApi.getAll();
        const flat = {};
        (res.data ?? res ?? []).forEach(s => { flat[s.key] = s.value; });
        setSettings(flat);
      } catch (_) {
        // defaults handled inside calculateRate
      }
    })();
  }, []);

  // ── Pre-fill in edit mode ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      try {
        const res = await milkEntryApi.getByFarmer(farmerId, {});
        const entries = res.data?.entries ?? res.data ?? [];
        const entry = entries.find(e => e.id === entryId);
        if (!entry) throw new Error('Entry not found');

        setFormData({
          date:     parseLocalDate(entry.date.slice(0, 10)),
          litresKg: String(entry.litresKg ?? ''),
          fat:       String(entry.fat      ?? ''),
          snf:       String(entry.snf      ?? ''),
          rate:      String(entry.rate     ?? ''),
          rupees:    Number(entry.rupees   ?? 0),
        });
        setRateManual(true); // keep existing rate, don't auto-overwrite on load
      } catch (err) {
        Alert.alert('Error', err.message);
        navigation.goBack();
      } finally {
        setFetching(false);
      }
    })();
  }, [entryId]);

  // ── Auto-calculate rate + rupees ───────────────────────────────────────────
  useEffect(() => {
    const l = parseFloat(formData.litresKg);
    const f = parseFloat(formData.fat);
    const s = parseFloat(formData.snf);
    const r = parseFloat(formData.rate);

    if (rateManual) {
      // Only recalc rupees from manual rate
      if (!isNaN(r) && r > 0 && !isNaN(l) && l > 0) {
        setFormData(prev => ({ ...prev, rupees: calculateRupees(l, r) }));
      }
      return;
    }

    if (formData.litresKg && formData.fat && formData.snf && !isNaN(l) && !isNaN(f) && !isNaN(s)) {
      const calcRate   = calculateRate(f, s, settings);
      const calcRupees = calculateRupees(l, calcRate);
      setFormData(prev => ({ ...prev, rate: String(calcRate), rupees: calcRupees }));
    }
  }, [formData.litresKg, formData.fat, formData.snf, settings]);

  // Recalc rupees when rate changes in manual mode
  useEffect(() => {
    if (!rateManual) return;
    const l = parseFloat(formData.litresKg);
    const r = parseFloat(formData.rate);
    if (!isNaN(r) && r > 0 && !isNaN(l) && l > 0) {
      setFormData(prev => ({ ...prev, rupees: calculateRupees(l, r) }));
    }
  }, [formData.rate]);

  // ── Field helpers ──────────────────────────────────────────────────────────
  const setField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const handleRateChange = (value) => {
    setRateManual(true);
    setField('rate', value);
  };

  const resetRateAuto = () => {
    setRateManual(false);
    // Wipe rate so the auto-calc effect re-fires
    setFormData(prev => ({ ...prev, rate: '' }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};

    const l = parseFloat(formData.litresKg);
    if (!formData.litresKg.trim() || isNaN(l) || l <= 0)
      e.litresKg = 'Enter a valid quantity greater than 0';

    const f = parseFloat(formData.fat);
    if (!formData.fat.trim() || isNaN(f) || f <= 0 || f > 20)
      e.fat = 'FAT % must be between 0 and 20';

    const s = parseFloat(formData.snf);
    if (!formData.snf.trim() || isNaN(s) || s <= 0 || s > 20)
      e.snf = 'SNF % must be between 0 and 20';

    const r = parseFloat(formData.rate);
    if (!formData.rate || isNaN(r) || r <= 0)
      e.rate = 'Rate must be a positive number';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        farmerId,
        date:     toISO(formData.date),
        litresKg: parseFloat(formData.litresKg),
        fat:       parseFloat(formData.fat),
        snf:       parseFloat(formData.snf),
        rate:      parseFloat(formData.rate),
        rupees:    formData.rupees,
      };

      if (isEditMode) {
        await milkEntryApi.update(entryId, payload);
        Alert.alert('Success', 'Milk entry updated.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await milkEntryApi.create(payload);
        Alert.alert('Success', 'Milk entry saved.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const rupeesDisplay =
    formData.rupees > 0
      ? `Rs. ${formData.rupees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Farmer banner ──────────────────────────────────────────── */}
        {!!farmerName && (
          <View style={styles.farmerBanner}>
            <View style={styles.farmerAvatar}>
              <Text style={styles.farmerAvatarLetter}>
                {farmerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.farmerBannerName}>{farmerName}</Text>
            </View>
          </View>
        )}

        {/* ── Collection Details ─────────────────────────────────────── */}
        <SectionHeader title="COLLECTION DETAILS" />

        <Text style={styles.label}>
          Collection Date <Text style={styles.asterisk}>*</Text>
        </Text>

        {Platform.OS === 'web' ? (
          <View style={styles.dateField}>
            <MaterialIcons name="calendar-today" size={18} color={COLORS.primary} />
            <input
              type="date"
              value={toISO(formData.date)}
              max={toISO(new Date())}
              onChange={(e) => {
                if (e.target.value) setField('date', parseLocalDate(e.target.value));
              }}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: 14,
                color: COLORS.text,
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.dateField}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="calendar-today" size={18} color={COLORS.primary} />
              <Text style={styles.dateText}>{fmtDisplay(formData.date)}</Text>
              <MaterialIcons name="arrow-drop-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={formData.date}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                maximumDate={new Date()}
                onChange={(_, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selected) setField('date', selected);
                }}
              />
            )}
          </>
        )}

        <CustomInput
          label="Litres / KG"
          value={formData.litresKg}
          onChangeText={(v) => setField('litresKg', v)}
          placeholder="e.g. 14.30"
          error={errors.litresKg}
          keyboardType="decimal-pad"
          required
        />

        {/* ── Quality Parameters ─────────────────────────────────────── */}
        <SectionDivider title="QUALITY PARAMETERS" />

        <View style={styles.row2}>
          <View style={styles.halfField}>
            <CustomInput
              label="FAT %"
              value={formData.fat}
              onChangeText={(v) => setField('fat', v)}
              placeholder="e.g. 5.90"
              error={errors.fat}
              keyboardType="decimal-pad"
              required
            />
          </View>
          <View style={styles.halfField}>
            <CustomInput
              label="SNF %"
              value={formData.snf}
              onChangeText={(v) => setField('snf', v)}
              placeholder="e.g. 8.66"
              error={errors.snf}
              keyboardType="decimal-pad"
              required
            />
          </View>
        </View>

        {/* ── Payment Calculation ────────────────────────────────────── */}
        <SectionDivider title="PAYMENT CALCULATION" />

        <Text style={styles.label}>
          Rate per Litre{' '}
          <Text style={styles.asterisk}>*</Text>
          {rateManual && (
            <Text style={styles.manualTag}>  (manual override)</Text>
          )}
        </Text>
        <View style={styles.rateRow}>
          <View style={styles.rateInputWrap}>
            <CustomInput
              label=""
              value={formData.rate}
              onChangeText={handleRateChange}
              placeholder="Auto-calculated"
              error={errors.rate}
              keyboardType="decimal-pad"
            />
          </View>
          {rateManual && (
            <TouchableOpacity style={styles.resetBtn} onPress={resetRateAuto}>
              <MaterialIcons name="refresh" size={18} color={COLORS.primary} />
              <Text style={styles.resetBtnText}>Auto</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>Amount (Rs.) — Read Only</Text>
        <View style={styles.amountBox}>
          <MaterialIcons name="payments" size={18} color={COLORS.primary} />
          <Text style={styles.amountText}>{rupeesDisplay}</Text>
        </View>

        {/* ── Save button ────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <>
                <MaterialIcons name="save" size={20} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Save Entry</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── local helpers ─────────────────────────────────────────────────────────────

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SectionDivider({ title }) {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{title}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: 16, paddingBottom: 40 },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  farmerBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 10,
    padding: 14, marginBottom: 20, gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  farmerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  farmerAvatarLetter: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  farmerBannerName:   { fontSize: 15, fontWeight: '700', color: COLORS.text },

  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 0.8, marginBottom: 14, marginTop: 4,
  },
  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.8 },

  label:     { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  asterisk:  { color: COLORS.danger },
  manualTag: { fontSize: 11, color: COLORS.warning, fontWeight: '500' },

  dateField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, paddingHorizontal: 12, height: 44, marginBottom: 14,
  },
  dateText: { flex: 1, fontSize: 14, color: COLORS.text },

  row2:      { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },

  rateRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rateInputWrap: { flex: 1 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 2, paddingHorizontal: 10, height: 44,
    backgroundColor: COLORS.primaryPale, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.primaryLight,
  },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  amountBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.primaryPale, borderRadius: 8,
    paddingHorizontal: 14, height: 52, marginBottom: 28,
    borderWidth: 1, borderColor: COLORS.primaryLight,
  },
  amountText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 10, height: 50, gap: 8, elevation: 3,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
