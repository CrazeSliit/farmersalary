import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function CustomInput({
  label,
  value,
  onChangeText,
  placeholder    = '',
  error          = null,
  keyboardType   = 'default',
  multiline      = false,
  numberOfLines  = 1,
  secureTextEntry = false,
  editable       = true,
  required       = false,
  rightIcon      = null,
}) {
  const hasError = !!error;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.asterisk}> *</Text>}
      </Text>

      <View style={[
        styles.inputBox,
        multiline      && styles.inputMultiline,
        hasError       && styles.inputError,
        !editable      && styles.inputDisabled,
      ]}>
        <TextInput
          style={[styles.input, multiline && { height: numberOfLines * 22 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textDisabled}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          secureTextEntry={secureTextEntry}
          editable={editable}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label:   { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  asterisk: { color: COLORS.danger },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputMultiline: { alignItems: 'flex-start', paddingVertical: 10 },
  inputError:     { borderColor: COLORS.danger },
  inputDisabled:  { backgroundColor: COLORS.background },

  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    height: 44,
  },
  rightIcon: { marginLeft: 6 },

  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
});
