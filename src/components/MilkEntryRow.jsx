import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

function fmt(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtNum(n, decimals = 2) {
  return Number(n ?? 0).toFixed(decimals);
}

export default function MilkEntryRow({
  entry,
  index     = 0,
  onEdit    = null,
  onDelete  = null,
  isTotal   = false,
  isHeader  = false,
}) {
  const isEven = index % 2 === 0;

  // ── Header row ────────────────────────────────────────────────────
  if (isHeader) {
    return (
      <View style={styles.row}>
        <Text style={[styles.cell, styles.dateCell,   styles.headerText]}>Date</Text>
        <Text style={[styles.cell, styles.rcptCell,   styles.headerText]}>Rcpt</Text>
        <Text style={[styles.cell, styles.litresCell, styles.headerText]}>L/Kg</Text>
        <Text style={[styles.cell, styles.fatCell,    styles.headerText]}>FAT</Text>
        <Text style={[styles.cell, styles.rupeesCell, styles.headerText]}>Rs.</Text>
        {(onEdit || onDelete) && <View style={styles.actionCell} />}
      </View>
    );
  }

  // ── Total row ─────────────────────────────────────────────────────
  if (isTotal && entry) {
    return (
      <View style={[styles.row, styles.totalRow]}>
        <Text style={[styles.cell, styles.dateCell,   styles.totalText]}>TOTAL</Text>
        <Text style={[styles.cell, styles.rcptCell,   styles.totalText]}></Text>
        <Text style={[styles.cell, styles.litresCell, styles.totalText]}>{fmtNum(entry.totalLitres)}</Text>
        <Text style={[styles.cell, styles.fatCell,    styles.totalText]}>{fmtNum(entry.avgFat)}</Text>
        <Text style={[styles.cell, styles.rupeesCell, styles.totalText]}>{Number(entry.totalRupees ?? 0).toLocaleString()}</Text>
        {(onEdit || onDelete) && <View style={styles.actionCell} />}
      </View>
    );
  }

  // ── Data row ──────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      style={[styles.row, isEven && styles.rowEven]}
      onPress={onEdit}
      activeOpacity={onEdit ? 0.7 : 1}
    >
      <Text style={[styles.cell, styles.dateCell]}>{fmt(entry.date)}</Text>
      <Text style={[styles.cell, styles.rcptCell]}  numberOfLines={1}>{entry.receiptNo}</Text>
      <Text style={[styles.cell, styles.litresCell]}>{fmtNum(entry.litresKg)}</Text>
      <Text style={[styles.cell, styles.fatCell]}   >{fmtNum(entry.fat)}</Text>
      <Text style={[styles.cell, styles.rupeesCell]}>{Number(entry.rupees ?? 0).toLocaleString()}</Text>

      {(onEdit || onDelete) && (
        <View style={styles.actionCell}>
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="delete-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowEven:   { backgroundColor: COLORS.primaryPale },
  totalRow:  { backgroundColor: COLORS.primary + '15', borderTopWidth: 1.5, borderTopColor: COLORS.primary },

  cell:       { fontSize: 12, color: COLORS.text },
  headerText: { fontWeight: '700', color: COLORS.textSecondary, fontSize: 11 },
  totalText:  { fontWeight: '700', color: COLORS.primary },

  dateCell:   { width: 40 },
  rcptCell:   { flex: 1, paddingHorizontal: 4 },
  litresCell: { width: 48, textAlign: 'right' },
  fatCell:    { width: 40, textAlign: 'right' },
  rupeesCell: { width: 64, textAlign: 'right' },
  actionCell: { width: 28, alignItems: 'center' },
});
