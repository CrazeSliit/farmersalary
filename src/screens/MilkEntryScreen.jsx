import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function MilkEntryScreen({ navigation, route }) {
  const { farmerId, entryId } = route.params || {};
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{entryId ? 'Edit' : 'Add'} Milk Entry — Farmer: {farmerId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  text:      { fontSize: 18, color: COLORS.text },
});
