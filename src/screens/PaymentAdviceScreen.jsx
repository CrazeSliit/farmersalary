import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS } from '../constants/colors';
import { paymentApi, settingsApi } from '../api/apiService';
import ConfirmModal from '../components/ConfirmModal';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d) {
  const dt = new Date(d);
  const yy = String(dt.getFullYear()).slice(2);
  const mm  = String(dt.getMonth() + 1).padStart(2, '0');
  const dd  = String(dt.getDate()).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
}

function fmtDateShort(d) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function fmtRs(n) {
  return `Rs. ${Number(n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function pad(str, len, right = false) {
  const s = String(str ?? '');
  return right ? s.padEnd(len) : s.padStart(len);
}

// ── HTML for printing ─────────────────────────────────────────────────────────

function buildHtml(payment, farmer, settings, logoUri = null) {
  const entries = payment.entries ?? [];
  const period  = `${fmtDate(payment.periodStart)} - ${fmtDate(payment.periodEnd)}`;
  const region  = farmer.region  ?? settings.default_region  ?? '';
  const centre  = farmer.centre  ?? settings.default_centre  ?? '';

  const entryRows = entries.map(e => `
    <tr>
      <td>${fmtDateShort(e.date)}</td>
      <td class="num">${Number(e.litresKg).toFixed(1)}</td>
      <td class="num">${Number(e.fat).toFixed(1)}</td>
      <td class="num">${Number(e.snf).toFixed(2)}</td>
      <td class="num">${Number(e.rate).toFixed(0)}</td>
      <td class="num">${Number(e.rupees).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
    </tr>`).join('');

  const addressLines = (farmer.address ?? '').split('\n').map(l => `<p>${l}</p>`).join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: 'Courier New', monospace; font-size: 11px; padding: 20px; color: #111; }
  .center { text-align: center; }
  .bold   { font-weight: bold; }
  .header-box { border: 1px solid #999; padding: 10px 14px; margin-bottom: 8px; }
  .farmer-box { padding: 4px 0; margin-bottom: 8px; border-top: 1px solid #555; border-bottom: 1px solid #555; }
  p { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { border-bottom: 1px solid #555; padding: 3px 4px; text-align: left; font-size: 10px; }
  td { padding: 2px 4px; font-size: 11px; }
  .num  { text-align: right; }
  tr:nth-child(even) { background: #f7f7f7; }
  .total-row { border-top: 2px solid #333; font-weight: bold; }
  .deductions { margin-top: 8px; border-top: 1px solid #555; padding-top: 6px; }
  .net-row { font-size: 13px; font-weight: bold; margin-top: 4px; }
  .bank-box { margin-top: 8px; border-top: 1px solid #555; padding-top: 6px; }
  .double-line { border-top: 3px double #333; margin: 6px 0; }
</style>
</head>
<body>

<div class="header-box">
  ${logoUri ? `<div class="center"><img src="${logoUri}" style="height:60px;margin-bottom:6px;" /></div>` : ''}
  <p class="center bold">MILCO (PVT) LTD.</p>
  <p class="center bold">MILK PAYMENT ADVICE</p>
  <p class="center">Period: ${period}</p>
  <p class="center">Region: ${region}&nbsp;&nbsp;&nbsp;Centre: ${centre}</p>
</div>

<div class="farmer-box">
  <p><strong>Supplier No:</strong> ${farmer.fmsNo}</p>
  <p class="bold">${farmer.fmsName ?? farmer.name}</p>
  ${addressLines}
</div>

<table>
  <thead>
    <tr>
      <th>Date</th>
      <th class="num">L/Kg</th>
      <th class="num">FAT</th>
      <th class="num">SNF</th>
      <th class="num">Rate</th>
      <th class="num">Rs.</th>
    </tr>
  </thead>
  <tbody>
    ${entryRows}
  </tbody>
  <tfoot>
    <tr class="total-row">
      <td><strong>TOTAL</strong></td>
      <td class="num">${Number(payment.totalLitres).toFixed(2)}</td>
      <td class="num">${Number(payment.avgFat).toFixed(2)}</td>
      <td class="num">${Number(payment.avgSnf).toFixed(2)}</td>
      <td></td>
      <td class="num">${Number(payment.grossAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
    </tr>
  </tfoot>
</table>

<div class="double-line"></div>

<div class="deductions">
  <p>STAMP DUTY &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${Number(payment.stampDuty).toFixed(2)}</p>
  ${payment.cattleFeed > 0 ? `<p>CATTLE FEED &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${Number(payment.cattleFeed).toFixed(2)}</p>` : ''}
  ${payment.cattleMedicine > 0 ? `<p>CATTLE MEDICINE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${Number(payment.cattleMedicine).toFixed(2)}</p>` : ''}
  ${payment.mfssFund > 0 ? `<p>MFSS FUND &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${Number(payment.mfssFund).toFixed(2)}</p>` : ''}
  <p class="net-row">*** NET AMOUNT &nbsp;&nbsp; Rs. ${Number(payment.netAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
</div>

<div class="bank-box">
  <p>Credited to account:</p>
  <p class="bold">${farmer.bankAccount ?? ''}</p>
  <p>${farmer.bankName ?? ''}</p>
</div>

</body>
</html>`;
}

// ── screen ────────────────────────────────────────────────────────────────────

export default function PaymentAdviceScreen({ navigation, route }) {
  const { paymentId } = route.params ?? {};

  const [payment,     setPayment]     = useState(null);
  const [settings,    setSettings]    = useState({});
  const [loading,     setLoading]     = useState(true);
  const [sharing,     setSharing]     = useState(false);
  const [showDelete,  setShowDelete]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, sRes] = await Promise.all([
          paymentApi.getById(paymentId),
          settingsApi.getAll(),
        ]);
        setPayment(pRes.data);
        setSettings(sRes.data ?? {});
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [paymentId]);

  async function getLogoUri() {
    const asset = Asset.fromModule(require('../../assets/logo.png'));
    await asset.downloadAsync();
    const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: 'base64',
    });
    return `data:image/png;base64,${base64}`;
  }

  async function handlePrint() {
    if (!payment) return;
    setSharing(true);
    try {
      const logoUri = await getLogoUri();
      await Print.printAsync({
        html: buildHtml(payment, payment.farmer, settings, logoUri),
      });
    } catch (err) {
      if (!err.message?.includes('cancel')) Alert.alert('Print failed', err.message);
    } finally {
      setSharing(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await paymentApi.delete(paymentId);
      setShowDelete(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleShare() {
    if (!payment) return;
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) { Alert.alert('Sharing not available on this device'); return; }

    setSharing(true);
    try {
      const logoUri = await getLogoUri();
      const { uri } = await Print.printToFileAsync({
        html: buildHtml(payment, payment.farmer, settings, logoUri),
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Payment Advice — ${payment.farmer?.name ?? ''}`,
      });
    } catch (err) {
      if (!err.message?.includes('cancel')) Alert.alert('Share failed', err.message);
    } finally {
      setSharing(false);
    }
  }

  // ── loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!payment) return null;

  const farmer  = payment.farmer ?? {};
  const entries = payment.entries ?? [];
  const region  = farmer.region ?? settings.default_region ?? '';
  const centre  = farmer.centre ?? settings.default_centre ?? '';

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Advice</Text>
        <TouchableOpacity
          onPress={handleShare}
          disabled={sharing}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="share" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Document header */}
        <View style={styles.docBox}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.docLogo}
            resizeMode="contain"
          />
          <Text style={styles.companyName}>MILCO (PVT) LTD.</Text>
          <Text style={styles.docTitle}>MILK PAYMENT ADVICE</Text>
          <Text style={styles.docMeta}>Period: {fmtDate(payment.periodStart)} — {fmtDate(payment.periodEnd)}</Text>
          <Text style={styles.docMeta}>Region: {region}   Centre: {centre}</Text>
        </View>

        {/* Farmer info */}
        <View style={styles.farmerBox}>
          <Text style={styles.supplierLabel}>Supplier No: <Text style={styles.supplierNo}>{farmer.fmsNo}</Text></Text>
          <Text style={styles.farmerName}>{farmer.fmsName ?? farmer.name}</Text>
          {(farmer.address ?? '').split('\n').map((line, i) => (
            <Text key={i} style={styles.addressLine}>{line}</Text>
          ))}
        </View>

        {/* Entries table */}
        <View style={styles.tableContainer}>

          {/* Table header */}
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.tc, styles.tcDate, styles.thText]}>Date</Text>
            <Text style={[styles.tc, styles.tcNum,  styles.thText]}>L/Kg</Text>
            <Text style={[styles.tc, styles.tcNum,  styles.thText]}>FAT</Text>
            <Text style={[styles.tc, styles.tcNum,  styles.thText]}>SNF</Text>
            <Text style={[styles.tc, styles.tcRs,   styles.thText]}>Rs.</Text>
          </View>

          {/* Data rows */}
          {entries.map((e, i) => (
            <View key={e.id} style={[styles.tableRow, i % 2 === 0 && styles.tableRowEven]}>
              <Text style={[styles.tc, styles.tcDate]}>{fmtDateShort(e.date)}</Text>
              <Text style={[styles.tc, styles.tcNum]}>{Number(e.litresKg).toFixed(1)}</Text>
              <Text style={[styles.tc, styles.tcNum]}>{Number(e.fat).toFixed(1)}</Text>
              <Text style={[styles.tc, styles.tcNum]}>{Number(e.snf).toFixed(2)}</Text>
              <Text style={[styles.tc, styles.tcRs]}>{Number(e.rupees).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>
          ))}

          {/* Total row */}
          <View style={[styles.tableRow, styles.totalRow]}>
            <Text style={[styles.tc, styles.tcDate, styles.totalText]}>TOTAL</Text>
            <Text style={[styles.tc, styles.tcNum,  styles.totalText]}>{Number(payment.totalLitres).toFixed(2)}</Text>
            <Text style={[styles.tc, styles.tcNum,  styles.totalText]}>{Number(payment.avgFat).toFixed(2)}</Text>
            <Text style={[styles.tc, styles.tcNum,  styles.totalText]}>{Number(payment.avgSnf).toFixed(2)}</Text>
            <Text style={[styles.tc, styles.tcRs,   styles.totalText]}>
              {Number(payment.grossAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Deductions */}
        <View style={styles.deductionsBox}>
          <View style={styles.deductRow}>
            <Text style={styles.deductLabel}>STAMP DUTY</Text>
            <Text style={styles.deductValue}>{Number(payment.stampDuty).toFixed(2)}</Text>
          </View>
          {payment.cattleFeed > 0 && (
            <View style={styles.deductRow}>
              <Text style={styles.deductLabel}>CATTLE FEED</Text>
              <Text style={styles.deductValue}>{Number(payment.cattleFeed).toFixed(2)}</Text>
            </View>
          )}
          {payment.cattleMedicine > 0 && (
            <View style={styles.deductRow}>
              <Text style={styles.deductLabel}>CATTLE MEDICINE</Text>
              <Text style={styles.deductValue}>{Number(payment.cattleMedicine).toFixed(2)}</Text>
            </View>
          )}
          {payment.mfssFund > 0 && (
            <View style={styles.deductRow}>
              <Text style={styles.deductLabel}>MFSS FUND</Text>
              <Text style={styles.deductValue}>{Number(payment.mfssFund).toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.doubleBorder} />
          <View style={styles.deductRow}>
            <Text style={styles.netLabel}>*** NET AMOUNT</Text>
            <Text style={styles.netValue}>{fmtRs(payment.netAmount)}</Text>
          </View>
        </View>

        {/* Bank details */}
        <View style={styles.bankBox}>
          <Text style={styles.bankLabel}>Credited to account:</Text>
          <Text style={styles.bankAccount}>{farmer.bankAccount}</Text>
          <Text style={styles.bankName}>{farmer.bankName}</Text>
        </View>

      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => setShowDelete(true)}
          disabled={sharing || deleting}
          activeOpacity={0.85}
        >
          <MaterialIcons name="delete" size={20} color={COLORS.danger} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.printBtn]}
          onPress={handlePrint}
          disabled={sharing}
          activeOpacity={0.85}
        >
          {sharing ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <MaterialIcons name="print" size={20} color={COLORS.primary} />
              <Text style={styles.printBtnText}>Print</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.shareBtn]}
          onPress={handleShare}
          disabled={sharing}
          activeOpacity={0.85}
        >
          {sharing ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialIcons name="picture-as-pdf" size={20} color={COLORS.white} />
              <Text style={styles.shareBtnText}>Share PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={showDelete}
        title="Delete Payment?"
        message={`This will permanently remove the payment advice for ${payment.farmer?.name ?? ''}.`}
        type="danger"
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Top header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.white },

  scrollContent: { padding: 14, paddingBottom: 24 },

  // Document sections
  docBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  docLogo:     { width: 64, height: 64, marginBottom: 8 },
  companyName: { fontSize: 15, fontWeight: '800', color: COLORS.text, fontFamily: MONO },
  docTitle:    { fontSize: 13, fontWeight: '700', color: COLORS.text, fontFamily: MONO, marginTop: 2 },
  docMeta:     { fontSize: 12, color: COLORS.textSecondary, fontFamily: MONO, marginTop: 3 },

  farmerBox: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  supplierLabel: { fontSize: 12, color: COLORS.textSecondary, fontFamily: MONO },
  supplierNo:    { fontWeight: '700', color: COLORS.text },
  farmerName:    { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: MONO, marginTop: 4 },
  addressLine:   { fontSize: 12, color: COLORS.textSecondary, fontFamily: MONO },

  // Table
  tableContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tableRow:       { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8 },
  tableRowEven:   { backgroundColor: COLORS.primaryPale },
  tableHeaderRow: { backgroundColor: COLORS.primary + '18', borderBottomWidth: 1, borderBottomColor: COLORS.primary + '40' },
  totalRow: {
    borderTopWidth: 1.5,
    borderTopColor: COLORS.primary,
    backgroundColor: COLORS.primary + '12',
  },

  tc:       { fontSize: 11, color: COLORS.text, fontFamily: MONO },
  thText:   { fontWeight: '700', color: COLORS.textSecondary, fontSize: 10 },
  totalText:{ fontWeight: '700', color: COLORS.primary },

  tcDate: { width: 32 },
  tcNum:  { flex: 1, textAlign: 'right', paddingHorizontal: 2 },
  tcRs:   { width: 60, textAlign: 'right' },

  // Deductions
  deductionsBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  deductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  deductLabel: { fontSize: 12, color: COLORS.textSecondary, fontFamily: MONO },
  deductValue: { fontSize: 12, color: COLORS.text, fontFamily: MONO, fontWeight: '600' },
  doubleBorder: {
    borderTopWidth: 3,
    borderTopColor: COLORS.text,
    borderStyle: 'solid',
    marginVertical: 6,
  },
  netLabel: { fontSize: 14, fontWeight: '800', color: COLORS.text, fontFamily: MONO },
  netValue: { fontSize: 16, fontWeight: '800', color: COLORS.primary },

  // Bank
  bankBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  bankLabel:   { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  bankAccount: { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: MONO },
  bankName:    { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 13,
    gap: 8,
  },
  deleteBtn:     { borderWidth: 1.5, borderColor: COLORS.danger, backgroundColor: COLORS.surface },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },
  printBtn:      { borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.surface },
  shareBtn:      { backgroundColor: COLORS.primary },
  printBtnText:  { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  shareBtnText:  { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
