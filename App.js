import { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

const LOGO = require('./assets/logo.png');
const PRIMARY = '#2E7D32';

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      <Text style={styles.appName}>Highland Farmers Salary</Text>
      <Text style={styles.tagline}>Milk Payment Management</Text>
      <ActivityIndicator
        size="large"
        color={PRIMARY}
        style={styles.spinner}
      />
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return <SplashScreen />;

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: PRIMARY,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 4,
  },
  spinner: {
    marginTop: 32,
  },
});
