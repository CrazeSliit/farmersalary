import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { APP_VERSION } from '../constants/config';

function AnimatedDot({ delay }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1,   duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.Text style={[styles.dot, { opacity }]}>◌</Animated.Text>;
}

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Main');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🌿</Text>
      <Text style={styles.appName}>Highland Farmers Salary</Text>
      <Text style={styles.tagline}>"Empowering Dairy Farmers"</Text>
      <View style={styles.dots}>
        <AnimatedDot delay={0}   />
        <AnimatedDot delay={200} />
        <AnimatedDot delay={400} />
      </View>
      <Text style={styles.powered}>Powered by Chamuditha</Text>
      <Text style={styles.version}>v{APP_VERSION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon:    { fontSize: 64, marginBottom: 20 },
  appName: { fontSize: 24, fontWeight: 'bold', color: COLORS.white, textAlign: 'center', marginBottom: 8 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 32, fontStyle: 'italic' },
  dots:    { flexDirection: 'row', gap: 8, marginBottom: 60 },
  dot:     { fontSize: 28, color: COLORS.white },
  powered: { position: 'absolute', bottom: 32, color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  version: { position: 'absolute', bottom: 14, color: 'rgba(255,255,255,0.5)', fontSize: 11 },
});
