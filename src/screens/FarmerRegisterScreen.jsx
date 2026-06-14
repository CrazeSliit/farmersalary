import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { farmerApi } from '../api/apiService';
import CustomInput from '../components/CustomInput';

const EMPTY_FORM = {
  name:        '',
  fmsNo:       '',
  fmsName:     '',
  address:     '',
  region:      '',
  centre:      '',
  bankAccount: '',
  bankName:    '',
};

export default function FarmerRegisterScreen({ navigation, route }) {
  const farmerId   = route.params?.farmerId;
  const isEditMode = !!farmerId;

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  // ── Update header title ──────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({ title: isEditMode ? 'Edit Farmer' : 'Add New Farmer' });
  }, [isEditMode]);

  // ── Pre-fill in edit mode ────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      try {
        const res = await farmerApi.getById(farmerId);
        const f   = res.data;
        setFormData({
          name:        f.name        ?? '',
          fmsNo:       f.fmsNo       ?? '',
          fmsName:     f.fmsName     ?? '',
          address:     f.address     ?? '',
          region:      f.region      ?? '',
          centre:      f.centre      ?? '',
          bankAccount: f.bankAccount ?? '',
          bankName:    f.bankName    ?? '',
        });
      } catch (err) {
        Alert.alert('Error', 'Could not load farmer data.');
        navigation.goBack();
      } finally {
        setFetching(false);
      }
    })();
  }, [farmerId]);

  // ── Field helper ─────────────────────────────────────────────────
  const setField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  // ── Validation ───────────────────────────────────────────────────
  const validate = () => {
    const e = {};

    if (!formData.name.trim() || formData.name.trim().length < 2)
      e.name = 'Full name must be at least 2 characters';

    if (!formData.fmsNo.trim())
      e.fmsNo = 'FMS number is required';

    if (!formData.fmsName.trim() || formData.fmsName.trim().length < 2)
      e.fmsName = 'FMS registered name must be at least 2 characters';

    if (!formData.address.trim() || formData.address.trim().length < 5)
      e.address = 'Address must be at least 5 characters';

    if (formData.bankAccount.trim() && !/^\d+$/.test(formData.bankAccount.trim()))
      e.bankAccount = 'Bank account must contain digits only';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name:        formData.name.trim(),
        fmsNo:       formData.fmsNo.trim(),
        fmsName:     formData.fmsName.trim(),
        address:     formData.address.trim(),
        region:      formData.region.trim(),
        centre:      formData.centre.trim(),
        bankAccount: formData.bankAccount.trim(),
        bankName:    formData.bankName.trim(),
      };

      if (isEditMode) {
        await farmerApi.update(farmerId, payload);
        Alert.alert('Success', 'Farmer updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await farmerApi.create(payload);
        Alert.alert('Success', 'Farmer registered successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      if (err.message.toLowerCase().includes('fms number already exists')) {
        setErrors(prev => ({ ...prev, fmsNo: 'This FMS number is already registered' }));
      } else {
        Alert.alert('Error', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state while fetching edit data ───────────────────────
  if (fetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
        {/* ── Farmer Information ─────────────────────────────────── */}
        <SectionHeader title="FARMER INFORMATION" />

        <CustomInput
          label="Full Name"
          value={formData.name}
          onChangeText={(v) => setField('name', v)}
          placeholder="e.g. Duminda Lakmal"
          error={errors.name}
          required
        />
        <CustomInput
          label="FMS Number"
          value={formData.fmsNo}
          onChangeText={(v) => setField('fmsNo', v)}
          placeholder="e.g. 763"
          error={errors.fmsNo}
          keyboardType="default"
          required
        />
        <CustomInput
          label="FMS Registered Name"
          value={formData.fmsName}
          onChangeText={(v) => setField('fmsName', v)}
          placeholder="e.g. U A D M DUMINDA LAKMAL"
          error={errors.fmsName}
          required
        />
        <CustomInput
          label="Address"
          value={formData.address}
          onChangeText={(v) => setField('address', v)}
          placeholder="e.g. Wewapara, Unawatuna, Buttala"
          error={errors.address}
          multiline
          numberOfLines={3}
          required
        />
        <CustomInput
          label="Region"
          value={formData.region}
          onChangeText={(v) => setField('region', v)}
          placeholder="e.g. UVA"
          error={errors.region}
        />
        <CustomInput
          label="Centre / Collection Point"
          value={formData.centre}
          onChangeText={(v) => setField('centre', v)}
          placeholder="e.g. WELLAWAYA"
          error={errors.centre}
        />

        {/* ── Bank Details ───────────────────────────────────────── */}
        <SectionDivider title="BANK DETAILS" />

        <CustomInput
          label="Bank Account Number"
          value={formData.bankAccount}
          onChangeText={(v) => setField('bankAccount', v)}
          placeholder="e.g. 000501010102086"
          error={errors.bankAccount}
          keyboardType="numeric"
        />
        <CustomInput
          label="Bank Name"
          value={formData.bankName}
          onChangeText={(v) => setField('bankName', v)}
          placeholder="e.g. Regional Development Bank, Buttala"
          error={errors.bankName}
        />

        {/* ── Save Button ────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <>
                <MaterialIcons name="save" size={20} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Save Farmer</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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

  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 14,
    marginTop: 4,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    height: 50,
    marginTop: 8,
    gap: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
