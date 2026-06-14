import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { settingsApi } from '../api/apiService';
import CustomInput from '../components/CustomInput';

// ── section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={16} color={COLORS.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ── screen ────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const [form,    setForm]    = useState({
    company_name:   '',
    default_region: '',
    default_centre: '',
    stamp_duty:     '',
    base_rate:      '',
    std_fat:        '',
    std_snf:        '',
    fat_premium:    '',
    snf_premium:    '',
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // ── load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    settingsApi.getAll()
      .then(res => {
        const data = res.data ?? {};
        setForm(prev => ({
          ...prev,
          company_name:   data.company_name   ?? prev.company_name,
          default_region: data.default_region ?? prev.default_region,
          default_centre: data.default_centre ?? prev.default_centre,
          stamp_duty:     data.stamp_duty     ?? prev.stamp_duty,
          base_rate:      data.base_rate      ?? prev.base_rate,
          std_fat:        data.std_fat        ?? prev.std_fat,
          std_snf:        data.std_snf        ?? prev.std_snf,
          fat_premium:    data.fat_premium    ?? prev.fat_premium,
          snf_premium:    data.snf_premium    ?? prev.snf_premium,
        }));
      })
      .catch(err => Alert.alert('Error', err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    // Validate numeric fields
    const numericFields = ['stamp_duty', 'base_rate', 'std_fat', 'std_snf', 'fat_premium', 'snf_premium'];
    for (const key of numericFields) {
      if (isNaN(parseFloat(form[key])) || form[key].trim() === '') {
        Alert.alert('Validation Error', `${key.replace(/_/g, ' ')} must be a valid number.`);
        return;
      }
    }

    setSaving(true);
    try {
      await settingsApi.update(form);
      Alert.alert('Saved', 'Settings updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  function set(key) {
    return (value) => setForm(prev => ({ ...prev, [key]: value }));
  }

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* App bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Company settings */}
        <View style={styles.card}>
          <SectionHeader icon="business" title="COMPANY SETTINGS" />

          <CustomInput
            label="Company Name"
            value={form.company_name}
            onChangeText={set('company_name')}
            placeholder="e.g. MILCO (Private) Limited"
          />
          <CustomInput
            label="Default Region"
            value={form.default_region}
            onChangeText={set('default_region')}
            placeholder="e.g. UVA"
          />
          <CustomInput
            label="Default Centre"
            value={form.default_centre}
            onChangeText={set('default_centre')}
            placeholder="e.g. WELLAWAYA"
          />
        </View>

        {/* Payment settings */}
        <View style={styles.card}>
          <SectionHeader icon="payments" title="PAYMENT SETTINGS" />

          <CustomInput
            label="Stamp Duty (Rs.)"
            value={form.stamp_duty}
            onChangeText={set('stamp_duty')}
            keyboardType="decimal-pad"
            placeholder="25.00"
          />
          <CustomInput
            label="Base Rate per Litre (Rs.)"
            value={form.base_rate}
            onChangeText={set('base_rate')}
            keyboardType="decimal-pad"
            placeholder="180.00"
          />
        </View>

        {/* Rate calculation */}
        <View style={styles.card}>
          <SectionHeader icon="calculate" title="RATE CALCULATION" />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <CustomInput
                label="Standard FAT (%)"
                value={form.std_fat}
                onChangeText={set('std_fat')}
                keyboardType="decimal-pad"
                placeholder="4.00"
              />
            </View>
            <View style={styles.halfField}>
              <CustomInput
                label="Standard SNF (%)"
                value={form.std_snf}
                onChangeText={set('std_snf')}
                keyboardType="decimal-pad"
                placeholder="8.00"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <CustomInput
                label="FAT Premium (Rs./0.1%)"
                value={form.fat_premium}
                onChangeText={set('fat_premium')}
                keyboardType="decimal-pad"
                placeholder="2.50"
              />
            </View>
            <View style={styles.halfField}>
              <CustomInput
                label="SNF Premium (Rs./0.1%)"
                value={form.snf_premium}
                onChangeText={set('snf_premium')}
                keyboardType="decimal-pad"
                placeholder="1.80"
              />
            </View>
          </View>

          {/* Rate formula reminder */}
          <View style={styles.formulaBox}>
            <Text style={styles.formulaTitle}>Rate formula</Text>
            <Text style={styles.formulaText}>
              Base Rate + ((FAT − Std FAT) / 0.1 × FAT Premium){'\n'}
              + ((SNF − Std SNF) / 0.1 × SNF Premium)
            </Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.card}>
          <SectionHeader icon="info-outline" title="ABOUT" />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Application</Text>
            <Text style={styles.aboutValue}>Highland Farmers Salary</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Developer</Text>
            <Text style={styles.aboutValue}>BIZmaster Solutions</Text>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color={COLORS.white} />
              <Text style={styles.saveBtnText}>Save Settings</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },

  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },

  formulaBox: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    marginTop: 4,
  },
  formulaTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  formulaText:  { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  aboutLabel: { fontSize: 13, color: COLORS.textSecondary },
  aboutValue: { fontSize: 13, color: COLORS.text, fontWeight: '600' },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 15,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
