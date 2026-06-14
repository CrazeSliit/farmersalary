import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

import SplashScreen        from '../screens/SplashScreen';
import HomeScreen          from '../screens/HomeScreen';
import FarmerListScreen    from '../screens/FarmerListScreen';
import FarmerRegisterScreen from '../screens/FarmerRegisterScreen';
import FarmerDetailScreen  from '../screens/FarmerDetailScreen';
import MilkEntryScreen     from '../screens/MilkEntryScreen';
import MilkEntryListScreen from '../screens/MilkEntryListScreen';
import PaymentAdviceScreen from '../screens/PaymentAdviceScreen';
import ReportScreen        from '../screens/ReportScreen';
import SettingsScreen      from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: { backgroundColor: COLORS.surface },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home:     'home',
            Farmers:  'people',
            Reports:  'bar-chart',
            Settings: 'settings',
          };
          return <MaterialIcons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Farmers"  component={FarmerListScreen} />
      <Tab.Screen name="Reports"  component={ReportScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Main"   component={MainTabs} />

        <Stack.Screen
          name="FarmerRegister"
          component={FarmerRegisterScreen}
          options={{ headerShown: true, title: 'Register Farmer', headerTintColor: COLORS.primary }}
        />
        <Stack.Screen
          name="FarmerDetail"
          component={FarmerDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MilkEntry"
          component={MilkEntryScreen}
          options={{ headerShown: true, title: 'Milk Entry', headerTintColor: COLORS.primary }}
        />
        <Stack.Screen
          name="MilkEntryList"
          component={MilkEntryListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PaymentAdvice"
          component={PaymentAdviceScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
