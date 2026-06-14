import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function FarmerCard({
  farmer,
  onPress,
  onEdit        = null,
  onDelete      = null,
  showActions   = true,
  compact       = false,
}) {
  return (
    <TouchableOpacity style={[styles.card, compact && styles.cardCompact]} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.left}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{farmer.name?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{farmer.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>FMS: {farmer.fmsNo}  ·  {farmer.centre}</Text>
          {!compact && (
            <>
              <Text style={styles.meta} numberOfLines={1}>{farmer.region}</Text>
              <Text style={styles.address} numberOfLines={2}>{farmer.address}</Text>
            </>
          )}
        </View>
      </View>

      {showActions && (onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.iconBtn} onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="edit" size={20} color={COLORS.secondary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.iconBtn} onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="delete" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardCompact: { padding: 10, marginBottom: 8 },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  info:        { flex: 1 },
  name:        { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  meta:        { fontSize: 12, color: COLORS.textSecondary, marginBottom: 1 },
  address:     { fontSize: 11, color: COLORS.textDisabled, marginTop: 2 },
  actions:     { flexDirection: 'row', gap: 4 },
  iconBtn:     { padding: 4 },
});
