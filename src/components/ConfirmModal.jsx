import {
  Modal, View, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const TYPE_CONFIG = {
  danger:  { color: COLORS.danger,    icon: 'delete-forever' },
  warning: { color: COLORS.warning,   icon: 'warning' },
  info:    { color: COLORS.secondary, icon: 'info' },
};

export default function ConfirmModal({
  visible,
  title,
  message       = null,
  onConfirm,
  onCancel,
  confirmText   = 'Confirm',
  cancelText    = 'Cancel',
  type          = 'warning',
  loading       = false,
}) {
  const { color, icon } = TYPE_CONFIG[type] ?? TYPE_CONFIG.warning;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity style={styles.card} activeOpacity={1}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: color + '18' }]}>
            <MaterialIcons name={icon} size={32} color={color} />
          </View>

          {/* Text */}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: color }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={styles.confirmText}>{confirmText}</Text>
              }
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title:   { fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  btnRow:  { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  btn:     { flex: 1, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cancelBtn:   { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  cancelText:  { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  confirmText: { fontSize: 15, color: COLORS.white, fontWeight: '700' },
});
