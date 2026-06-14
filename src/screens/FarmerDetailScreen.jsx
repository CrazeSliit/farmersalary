import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function FarmerDetailScreen({ navigation, route }) {
  const { farmerId } = route.params || {};
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Farmer Detail — ID: {farmerId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  text:      { fontSize: 18, color: COLORS.text },
});
