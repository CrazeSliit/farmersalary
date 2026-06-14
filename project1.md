# 🌿 Highland Farmers Salary
## Complete System Documentation

> A React Native mobile application for farmer-wise milk collection payment management, modelled on the MILCO (Private) Limited Payment Advice system used in Sri Lanka's dairy sector.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Database Schema — Prisma](#5-database-schema--prisma)
6. [Backend API — Node.js + Express](#6-backend-api--nodejs--express)
7. [Mobile App Navigation](#7-mobile-app-navigation)
8. [Mobile Screens — All 10 Pages](#8-mobile-screens--all-10-pages)
   - [Screen 1: Splash Screen](#screen-1-splash-screen)
   - [Screen 2: Home / Dashboard](#screen-2-home--dashboard)
   - [Screen 3: Farmer List](#screen-3-farmer-list)
   - [Screen 4: Farmer Register / Edit](#screen-4-farmer-register--edit)
   - [Screen 5: Farmer Detail](#screen-5-farmer-detail)
   - [Screen 6: Milk Entry Add / Edit](#screen-6-milk-entry-add--edit)
   - [Screen 7: Milk Entry List](#screen-7-milk-entry-list)
   - [Screen 8: Payment Advice](#screen-8-payment-advice)
   - [Screen 9: Reports](#screen-9-reports)
   - [Screen 10: Settings](#screen-10-settings)
9. [Reusable Components — All 12](#9-reusable-components--all-12)
10. [API Service Layer](#10-api-service-layer)
11. [Milk Rate Calculation Logic](#11-milk-rate-calculation-logic)
12. [Sample Data — From MILCO Payment Advice](#12-sample-data--from-milco-payment-advice)
13. [Environment Variables](#13-environment-variables)
14. [Setup & Installation Guide](#14-setup--installation-guide)
15. [Color Theme](#15-color-theme)

---

## 1. Project Overview

**Highland Farmers Salary** is a mobile application built with **React Native (Expo)** that enables milk collection centres to manage daily milk collections and generate payment advices for individual dairy farmers. The system is based on the **MILCO (Milk Industries Company) Payment Advice** document format used across Sri Lanka.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| Farmer Registration | Register farmers with Name, Address, FMS No, FMS Name, Region, Centre, Bank details |
| Milk Entry Management | Record daily milk collection per farmer (Litres, FAT %, SNF %, Rate, Amount) |
| Payment Advice Generation | Auto-calculate gross/net payment per farmer for any period |
| Reports & Analytics | Period-based reports with farmer-wise breakdowns and charts |
| Print / Share | Export payment advice slips in MILCO format as shareable PDF |

### Who Uses This App

| Role | Capabilities |
|------|-------------|
| Centre Manager | Add milk entries daily, register farmers, generate payments |
| Supervisor | Review reports, view all farmers, export data |
| Administrator | Configure settings, manage stamp duty, rate parameters |

---

## 2. System Architecture

The application follows a **Client–Server** architecture. Prisma runs on the Node.js backend — it cannot run directly inside a React Native mobile environment because Prisma requires Node.js native modules unavailable in the mobile JavaScript engine (Hermes/JSC). The mobile app communicates with the backend via HTTP REST API.

```
┌──────────────────────────────────────────────────────────┐
│                   MOBILE CLIENT                          │
│               React Native (Expo)                        │
│                                                          │
│   ┌──────────────────┐   ┌───────────────────────────┐  │
│   │    10 Screens    │   │      12 Components        │  │
│   └──────────────────┘   └───────────────────────────┘  │
│                │                                         │
│   ┌────────────────────────┐                            │
│   │     API Service Layer  │  ←── axios HTTP client    │
│   └────────────────────────┘                            │
└───────────────────────┬──────────────────────────────────┘
                        │  HTTP REST API (JSON)
                        ▼
┌──────────────────────────────────────────────────────────┐
│                   BACKEND SERVER                         │
│               Node.js + Express.js                       │
│                                                          │
│   ┌──────────────────┐   ┌───────────────────────────┐  │
│   │  Routes (6 sets) │   │  Controllers (6 sets)     │  │
│   └──────────────────┘   └───────────────────────────┘  │
│                │                                         │
│   ┌────────────────────────┐                            │
│   │     Prisma ORM Client  │                            │
│   └────────────────────────┘                            │
│                │                                         │
│   ┌────────────────────────┐                            │
│   │   SQLite Database      │  (farmers.db)              │
│   │   4 Tables:            │                            │
│   │   Farmer               │                            │
│   │   MilkEntry            │                            │
│   │   Payment              │                            │
│   │   SystemSettings       │                            │
│   └────────────────────────┘                            │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

### Frontend — Mobile App

| Technology | Version | Purpose |
|-----------|---------|---------|
| React Native | 0.74+ | Mobile app framework |
| Expo SDK | 51+ | Development toolchain & device APIs |
| React Navigation | 6.x | Screen navigation (Stack + Bottom Tabs) |
| Axios | 1.x | HTTP client for API requests |
| React Native Paper | 5.x | UI component library (Material Design) |
| @react-native-community/datetimepicker | Latest | Cross-platform date picker |
| React Native Chart Kit | Latest | Bar/line charts in Reports screen |
| React Native SVG | Latest | Required peer for Chart Kit |
| Expo Print | Latest | Generate PDF for payment advice |
| Expo Sharing | Latest | Share generated PDF |

### Backend — Server

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Server runtime |
| Express.js | 4.x | REST API framework |
| Prisma ORM | 5.x | Database access & migrations |
| SQLite | 3.x | Lightweight local database |
| cors | 2.x | Cross-origin requests from mobile |
| dotenv | Latest | Environment variable management |
| express-validator | Latest | Request input validation |

---

## 4. Project Folder Structure

```
highland-farmers-salary/
│
├── backend/                              ← Node.js + Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma                 ← All database model definitions
│   │   ├── seed.js                       ← Seed MILCO sample data
│   │   └── migrations/                  ← Auto-generated Prisma migration files
│   ├── src/
│   │   ├── routes/
│   │   │   ├── farmerRoutes.js           ← GET/POST/PUT/DELETE /api/farmers
│   │   │   ├── milkEntryRoutes.js        ← GET/POST/PUT/DELETE /api/milk-entries
│   │   │   ├── paymentRoutes.js          ← GET/POST /api/payments
│   │   │   ├── reportRoutes.js           ← GET /api/reports
│   │   │   ├── dashboardRoutes.js        ← GET /api/dashboard/stats
│   │   │   └── settingsRoutes.js         ← GET/PUT /api/settings
│   │   ├── controllers/
│   │   │   ├── farmerController.js       ← Farmer CRUD business logic
│   │   │   ├── milkEntryController.js    ← Milk entry CRUD business logic
│   │   │   ├── paymentController.js      ← Payment generation & retrieval
│   │   │   ├── reportController.js       ← Aggregation & summary logic
│   │   │   ├── dashboardController.js    ← Dashboard stats aggregation
│   │   │   └── settingsController.js     ← App settings logic
│   │   ├── middleware/
│   │   │   ├── validate.js               ← express-validator middleware
│   │   │   └── errorHandler.js           ← Global error handler
│   │   ├── utils/
│   │   │   └── calculations.js           ← Rate & amount calculation helpers
│   │   └── app.js                        ← Express app setup (routes + middleware)
│   ├── server.js                         ← Entry point (starts HTTP server)
│   ├── package.json
│   └── .env                              ← DATABASE_URL, PORT
│
└── mobile/                               ← React Native (Expo)
    ├── src/
    │   ├── screens/
    │   │   ├── SplashScreen.jsx           ← App intro / loading
    │   │   ├── HomeScreen.jsx             ← Dashboard with stats & quick actions
    │   │   ├── FarmerListScreen.jsx       ← Searchable list of all farmers
    │   │   ├── FarmerRegisterScreen.jsx   ← Add / Edit farmer form
    │   │   ├── FarmerDetailScreen.jsx     ← Farmer detail hub (3 tabs)
    │   │   ├── MilkEntryScreen.jsx        ← Add / Edit single milk entry
    │   │   ├── MilkEntryListScreen.jsx    ← Table of entries with filter & totals
    │   │   ├── PaymentAdviceScreen.jsx    ← MILCO-format payment slip
    │   │   ├── ReportScreen.jsx           ← Analytics & period reports
    │   │   └── SettingsScreen.jsx         ← App configuration
    │   ├── components/
    │   │   ├── CustomInput.jsx            ← Labelled text input with error support
    │   │   ├── CustomButton.jsx           ← Multi-variant button with loading
    │   │   ├── FarmerCard.jsx             ← Farmer summary card for lists
    │   │   ├── MilkEntryRow.jsx           ← Single row in milk entry table
    │   │   ├── StatCard.jsx               ← Metric card (dashboard/reports)
    │   │   ├── PaymentAdviceTable.jsx     ← Full payment advice table component
    │   │   ├── LoadingSpinner.jsx         ← Overlay loading indicator
    │   │   ├── EmptyState.jsx             ← Empty list / no-data placeholder
    │   │   ├── DatePickerComponent.jsx    ← Cross-platform date picker wrapper
    │   │   ├── Header.jsx                 ← Custom navigation header
    │   │   ├── SectionHeader.jsx          ← Section divider with optional action
    │   │   └── ConfirmModal.jsx           ← Confirmation dialog modal
    │   ├── navigation/
    │   │   └── AppNavigator.jsx           ← Full navigation configuration
    │   ├── api/
    │   │   └── apiService.js              ← All axios API call functions
    │   ├── constants/
    │   │   ├── colors.js                  ← App color palette
    │   │   └── config.js                  ← API base URL, app constants
    │   └── utils/
    │       └── calculations.js            ← Client-side rate/amount helpers
    ├── App.jsx                            ← Root component
    ├── app.json                           ← Expo configuration
    └── package.json
```

---

## 5. Database Schema — Prisma

**File:** `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─── Farmer Table ──────────────────────────────────────────────────────────
// Stores all registered dairy farmers / suppliers
model Farmer {
  id          Int         @id @default(autoincrement())
  fmsNo       String      @unique    // FMS Registration Number (e.g. "763")
  fmsName     String                 // Official FMS registered name (e.g. "U A D M DUMINDA LAKMAL")
  name        String                 // Common display name (e.g. "Duminda Lakmal")
  address     String                 // Full address — can be multiline
  region      String      @default("") // Region name (e.g. "UVA")
  centre      String      @default("") // Collection centre (e.g. "WELLAWAYA")
  bankAccount String      @default("") // Bank account number credited
  bankName    String      @default("") // Bank name (e.g. "Regional Development Bank")
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  milkEntries MilkEntry[]
  payments    Payment[]
}

// ─── Daily Milk Entry Table ────────────────────────────────────────────────
// One record per farmer per collection day
model MilkEntry {
  id         Int      @id @default(autoincrement())
  farmerId   Int
  farmer     Farmer   @relation(fields: [farmerId], references: [id], onDelete: Cascade)

  date       DateTime          // Collection date
  receiptNo  String            // Receipt / collection slip number (e.g. "237222")
  litresKg   Float             // Volume collected in litres (e.g. 14.30)
  fat        Float             // FAT percentage (e.g. 5.90)
  snf        Float             // Solids-Not-Fat percentage (e.g. 8.66)
  rate       Float             // Calculated rate per litre (e.g. 198.78)
  rupees     Float             // Payment = litresKg × rate (e.g. 2842.55)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// ─── Payment Advice Table ──────────────────────────────────────────────────
// Generated payment advice for a farmer covering a specific period
model Payment {
  id            Int      @id @default(autoincrement())
  farmerId      Int
  farmer        Farmer   @relation(fields: [farmerId], references: [id], onDelete: Cascade)

  periodStart   DateTime          // Payment period start date (e.g. 2026-05-01)
  periodEnd     DateTime          // Payment period end date   (e.g. 2026-05-15)
  totalLitres   Float             // Sum of all litresKg in the period
  avgFat        Float             // Average FAT % across all entries
  avgSnf        Float             // Average SNF % across all entries
  grossAmount   Float             // Total rupees before deductions
  stampDuty     Float   @default(25.00)  // Stamp duty deducted (default Rs. 25)
  netAmount     Float             // grossAmount - stampDuty
  bankAccount   String  @default("")     // Account credited
  bankName      String  @default("")     // Bank name

  createdAt     DateTime @default(now())
}

// ─── System Settings Table ─────────────────────────────────────────────────
// Key-value store for configurable app settings
model SystemSettings {
  id        Int    @id @default(autoincrement())
  key       String @unique    // e.g. "company_name", "stamp_duty", "base_rate"
  value     String            // Stored as string, cast on read
}
```

### Database Relationships

```
Farmer (1) ─────────────── (Many) MilkEntry
Farmer (1) ─────────────── (Many) Payment
```

Cascade deletion is enabled: deleting a Farmer will automatically delete all their MilkEntry and Payment records.

---

## 6. Backend API — Node.js + Express

**Base URL:** `http://localhost:3000/api`

All responses follow this envelope format:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "Error message here" }
```

---

### 6.1 Farmer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/farmers` | Get all farmers (with optional `?search=&region=`) |
| `GET` | `/farmers/:id` | Get single farmer by ID |
| `POST` | `/farmers` | Register a new farmer |
| `PUT` | `/farmers/:id` | Update existing farmer info |
| `DELETE` | `/farmers/:id` | Delete farmer and all related data |

**POST `/farmers` — Request Body:**
```json
{
  "fmsNo": "763",
  "fmsName": "U A D M DUMINDA LAKMAL",
  "name": "Duminda Lakmal",
  "address": "Wewapara,\nUnawatuna,\nButtala",
  "region": "UVA",
  "centre": "WELLAWAYA",
  "bankAccount": "000501010102086",
  "bankName": "Regional Development Bank, Buttala"
}
```

**GET `/farmers` — Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fmsNo": "763",
      "fmsName": "U A D M DUMINDA LAKMAL",
      "name": "Duminda Lakmal",
      "address": "Wewapara, Unawatuna, Buttala",
      "region": "UVA",
      "centre": "WELLAWAYA",
      "bankAccount": "000501010102086",
      "bankName": "Regional Development Bank",
      "isActive": true,
      "createdAt": "2026-05-01T00:00:00.000Z"
    }
  ]
}
```

---

### 6.2 Milk Entry Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/milk-entries/farmer/:farmerId` | Get entries for a farmer |
| `GET` | `/milk-entries/farmer/:farmerId?from=&to=&limit=` | Filter by date range |
| `POST` | `/milk-entries` | Add new daily milk entry |
| `PUT` | `/milk-entries/:id` | Update existing entry |
| `DELETE` | `/milk-entries/:id` | Delete single entry |

**POST `/milk-entries` — Request Body:**
```json
{
  "farmerId": 1,
  "date": "2026-05-01",
  "receiptNo": "237222",
  "litresKg": 14.30,
  "fat": 5.90,
  "snf": 8.66,
  "rate": 198.78,
  "rupees": 2842.55
}
```

**GET `/milk-entries/farmer/1?from=2026-05-01&to=2026-05-15` — Response:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": 1,
        "date": "2026-05-01T00:00:00.000Z",
        "receiptNo": "237222",
        "litresKg": 14.30,
        "fat": 5.90,
        "snf": 8.66,
        "rate": 198.78,
        "rupees": 2842.55
      }
    ],
    "totals": {
      "totalLitres": 230.30,
      "avgFat": 5.57,
      "avgSnf": 8.47,
      "totalRupees": 43119.22
    }
  }
}
```

---

### 6.3 Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/payments/farmer/:farmerId` | Get all payment advices for a farmer |
| `GET` | `/payments/:id` | Get single payment detail with all entries |
| `POST` | `/payments/generate` | Generate new payment advice for a period |
| `DELETE` | `/payments/:id` | Delete payment record |

**POST `/payments/generate` — Request Body:**
```json
{
  "farmerId": 1,
  "periodStart": "2026-05-01",
  "periodEnd": "2026-05-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "farmerId": 1,
    "farmer": {
      "fmsNo": "763",
      "fmsName": "U A D M DUMINDA LAKMAL",
      "address": "Wewapara, Unawatuna, Buttala",
      "region": "UVA",
      "centre": "WELLAWAYA",
      "bankAccount": "000501010102086",
      "bankName": "Regional Development Bank, Buttala"
    },
    "periodStart": "2026-05-01",
    "periodEnd": "2026-05-15",
    "entries": [ /* all MilkEntry records in period */ ],
    "totalLitres": 230.30,
    "avgFat": 5.57,
    "avgSnf": 8.47,
    "grossAmount": 43119.22,
    "stampDuty": 25.00,
    "netAmount": 43094.22
  }
}
```

---

### 6.4 Report Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/summary?from=&to=` | Overall summary for all farmers in a period |
| `GET` | `/reports/summary?from=&to=&farmerId=` | Summary for a specific farmer |
| `GET` | `/dashboard/stats` | Quick stats for dashboard cards |

---

### 6.5 Settings Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/settings` | Get all app settings as key-value object |
| `PUT` | `/settings` | Update one or more settings |

---

## 7. Mobile App Navigation

### Navigation Tree

```
App.jsx
└── AppNavigator.jsx (NavigationContainer)
    └── Root Stack Navigator
        ├── SplashScreen                        ← Initial route
        └── MainTabs (Bottom Tab Navigator)
            ├── Tab 1: Home        → HomeScreen
            ├── Tab 2: Farmers     → FarmerListScreen
            ├── Tab 3: Reports     → ReportScreen
            └── Tab 4: Settings    → SettingsScreen
            
        ── Pushed Stack Screens (on top of tabs) ──
            ├── FarmerRegisterScreen   params: { farmerId? }
            ├── FarmerDetailScreen     params: { farmerId }
            ├── MilkEntryScreen        params: { farmerId, entryId? }
            ├── MilkEntryListScreen    params: { farmerId }
            └── PaymentAdviceScreen    params: { paymentId } or { farmerId, from, to }
```

**File:** `src/navigation/AppNavigator.jsx`

```jsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// Import all screens
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import FarmerListScreen from '../screens/FarmerListScreen';
import FarmerRegisterScreen from '../screens/FarmerRegisterScreen';
import FarmerDetailScreen from '../screens/FarmerDetailScreen';
import MilkEntryScreen from '../screens/MilkEntryScreen';
import MilkEntryListScreen from '../screens/MilkEntryListScreen';
import PaymentAdviceScreen from '../screens/PaymentAdviceScreen';
import ReportScreen from '../screens/ReportScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home',
            Farmers: 'people',
            Reports: 'bar-chart',
            Settings: 'settings',
          };
          return <MaterialIcons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Farmers" component={FarmerListScreen} />
      <Tab.Screen name="Reports" component={ReportScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="FarmerRegister"
          component={FarmerRegisterScreen}
          options={{ headerShown: true, title: 'Register Farmer' }}
        />
        <Stack.Screen
          name="FarmerDetail"
          component={FarmerDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MilkEntry"
          component={MilkEntryScreen}
          options={{ headerShown: true, title: 'Milk Entry' }}
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
```

---

## 8. Mobile Screens — All 10 Pages

---

### Screen 1: Splash Screen
**File:** `src/screens/SplashScreen.jsx`

#### Purpose
App entry screen showing branding while the app loads. Automatically transitions to the Home screen after 2.5 seconds.

#### UI Layout
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│           🌿                    │
│      [App Logo / Icon]          │
│                                 │
│   Highland Farmers Salary       │
│                                 │
│  "Empowering Dairy Farmers"     │
│                                 │
│        ◌ ◌ ◌  (loading dots)   │
│                                 │
│   Powered by BIZmaster          │
│           v1.0.0                │
└─────────────────────────────────┘
```

#### State Variables
None — no state required.

#### Logic
```jsx
useEffect(() => {
  const timer = setTimeout(() => {
    navigation.replace('Main');
  }, 2500);
  return () => clearTimeout(timer);
}, []);
```

#### Key Behaviours
- Uses `navigation.replace()` so the user cannot go back to the splash screen.
- Background colour matches the green brand theme.

---

### Screen 2: Home / Dashboard
**File:** `src/screens/HomeScreen.jsx`

#### Purpose
Main hub screen showing summary statistics and quick-access action buttons. First screen after splash.

#### UI Layout
```
┌─────────────────────────────────┐
│ 🌿 Highland Farmers Salary  ⚙️ │
│ Welcome back!                   │
├─────────────────────────────────┤
│ THIS MONTH                      │
│ ┌─────────┐┌─────────┐┌──────┐ │
│ │   12    ││ 2,340 L ││Rs.89k│ │
│ │ Farmers ││  Milk   ││ Paid │ │
│ └─────────┘└─────────┘└──────┘ │
├─────────────────────────────────┤
│ QUICK ACTIONS                   │
│ ┌──────────────┐┌─────────────┐ │
│ │ ➕ Add Farmer││ 🥛 Add Entry│ │
│ └──────────────┘└─────────────┘ │
│ ┌──────────────┐┌─────────────┐ │
│ │ 📊 Reports   ││ 💳 Payment │ │
│ └──────────────┘└─────────────┘ │
├─────────────────────────────────┤
│ RECENT FARMERS                  │
│ [FarmerCard — Duminda Lakmal]   │
│ [FarmerCard — Farmer B]         │
│ [FarmerCard — Farmer C]         │
├─────────────────────────────────┤
│ 🏠 Home │ 👥 Farmers │ 📊 │ ⚙️ │
└─────────────────────────────────┘
```

#### State Variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `stats` | Object | `{}` | Dashboard numbers (totalFarmers, monthlyLitres, monthlyPayment) |
| `recentFarmers` | Array | `[]` | Last 5 active farmers |
| `loading` | Boolean | `true` | Data loading state |
| `refreshing` | Boolean | `false` | Pull-to-refresh state |

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| Load dashboard data | `useEffect` on mount | Call `/dashboard/stats` and `/farmers?limit=5` |
| Pull to refresh | Swipe down | Re-fetch all data |
| Add Farmer | Quick action button | Navigate to `FarmerRegister` |
| Add Milk Entry | Quick action button | Navigate to `FarmerList` (select farmer first) |
| View Reports | Quick action button | Switch to Reports tab |
| Payment Advice | Quick action button | Navigate to `FarmerList` with advice mode |
| Farmer card press | Tap | Navigate to `FarmerDetail` with `farmerId` |

#### API Calls
```js
GET /api/dashboard/stats
GET /api/farmers?limit=5&sort=createdAt&order=desc
```

---

### Screen 3: Farmer List
**File:** `src/screens/FarmerListScreen.jsx`

#### Purpose
Browse and search all registered farmers. Entry point to farmer management. Includes a FAB for quick farmer registration.

#### UI Layout
```
┌─────────────────────────────────┐
│ 👥 Farmers                 [12] │
├─────────────────────────────────┤
│ 🔍 Search by name or FMS No...  │
├─────────────────────────────────┤
│ [FarmerCard]                    │
│  FMS: 763 | Duminda Lakmal      │
│  Centre: Wellawaya | UVA        │
│  📍 Wewapara, Buttala           │
│                    [✏️] [🗑️]   │
├─────────────────────────────────┤
│ [FarmerCard]                    │
│ ...                             │
│                                 │
│                         [+ FAB] │
├─────────────────────────────────┤
│ 🏠    │  👥    │  📊   │   ⚙️  │
└─────────────────────────────────┘
```

#### State Variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `farmers` | Array | `[]` | Full list from API |
| `filteredFarmers` | Array | `[]` | Search-result subset |
| `searchQuery` | String | `""` | Live search text |
| `loading` | Boolean | `true` | Initial fetch state |
| `refreshing` | Boolean | `false` | Pull-to-refresh |
| `showDeleteModal` | Boolean | `false` | Delete confirm modal visibility |
| `selectedFarmer` | Object | `null` | Farmer targeted for deletion |

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| Load farmers | Mount | `GET /farmers` |
| Search | Text change | Filter `filteredFarmers` locally (no API call) |
| Open farmer | Card press | Navigate to `FarmerDetail` |
| Add farmer | FAB press | Navigate to `FarmerRegister` |
| Edit farmer | Edit icon on card | Navigate to `FarmerRegister` with `{ farmerId }` |
| Delete farmer | Delete icon on card | Show `ConfirmModal` → `DELETE /farmers/:id` |
| Pull to refresh | Swipe down | Re-fetch all farmers |

#### API Calls
```js
GET    /api/farmers
DELETE /api/farmers/:id
```

---

### Screen 4: Farmer Register / Edit
**File:** `src/screens/FarmerRegisterScreen.jsx`

#### Purpose
Form screen used for **both** registering a new farmer and editing an existing one. When `farmerId` is passed as a navigation param, the screen loads that farmer's data and switches to edit mode.

#### UI Layout
```
┌─────────────────────────────────┐
│ ← Add New Farmer                │
├─────────────────────────────────┤
│ FARMER INFORMATION              │
│                                 │
│ Full Name *                     │
│ ┌───────────────────────────┐   │
│ │ e.g. Duminda Lakmal       │   │
│ └───────────────────────────┘   │
│                                 │
│ FMS Number *                    │
│ ┌───────────────────────────┐   │
│ │ 763                       │   │
│ └───────────────────────────┘   │
│                                 │
│ FMS Registered Name *           │
│ ┌───────────────────────────┐   │
│ │ U A D M DUMINDA LAKMAL    │   │
│ └───────────────────────────┘   │
│                                 │
│ Address *                       │
│ ┌───────────────────────────┐   │
│ │ Wewapara,                 │   │
│ │ Unawatuna, Buttala        │   │
│ └───────────────────────────┘   │
│                                 │
│ Region                          │
│ ┌───────────────────────────┐   │
│ │ UVA                       │   │
│ └───────────────────────────┘   │
│                                 │
│ Centre / Collection Point       │
│ ┌───────────────────────────┐   │
│ │ WELLAWAYA                 │   │
│ └───────────────────────────┘   │
│                                 │
│ ── BANK DETAILS ──────────────  │
│                                 │
│ Bank Account Number             │
│ ┌───────────────────────────┐   │
│ │ 000501010102086           │   │
│ └───────────────────────────┘   │
│                                 │
│ Bank Name                       │
│ ┌───────────────────────────┐   │
│ │ Regional Development Bank │   │
│ └───────────────────────────┘   │
│                                 │
│ ┌───────────────────────────┐   │
│ │    💾  Save Farmer        │   │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```

#### Form Fields Reference

| Field | Required | Type | Validation Rule |
|-------|:--------:|------|-----------------|
| Full Name | ✅ | Text | Minimum 2 characters |
| FMS Number | ✅ | Text | Must be unique across farmers |
| FMS Registered Name | ✅ | Text | Minimum 2 characters |
| Address | ✅ | Multiline Text | Minimum 5 characters |
| Region | ❌ | Text | — |
| Centre | ❌ | Text | — |
| Bank Account Number | ❌ | Numeric Text | Digits only |
| Bank Name | ❌ | Text | — |

#### State Variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `formData` | Object | all empty strings | Holds all form field values |
| `errors` | Object | `{}` | Field-level validation messages |
| `loading` | Boolean | `false` | Submit spinner state |
| `isEditMode` | Boolean | `false` | True when editing existing farmer |

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| Pre-fill form | Mount in edit mode | `GET /farmers/:id` then populate `formData` |
| Validate | Save button press | Check all required fields and uniqueness |
| Save (new) | Save button on valid form | `POST /api/farmers` |
| Save (edit) | Save button in edit mode | `PUT /api/farmers/:id` |
| Navigate back | API success | `navigation.goBack()` with success toast |

#### Navigation Params Received
```js
// Edit mode:
route.params = { farmerId: 1 }
// Add mode:
route.params = undefined
```

---

### Screen 5: Farmer Detail
**File:** `src/screens/FarmerDetailScreen.jsx`

#### Purpose
Central hub for a specific farmer. Displays full profile information and organises milk entries, payment history, and stats across three tabs. All farmer-specific actions are accessible from this screen.

#### UI Layout
```
┌─────────────────────────────────┐
│ ←  Farmer Details       ✏️  ⋮  │
├─────────────────────────────────┤
│  FMS No: 763                    │
│  U A D M DUMINDA LAKMAL         │
│  📍 Wewapara, Unawatuna,        │
│     Buttala                     │
│  🏛️ Region: UVA | WELLAWAYA     │
│  🏦 000501010102086             │
│     Regional Development Bank   │
├─────────────────────────────────┤
│ [Milk Entries] [Payments] [Stats]│
├─────────────────────────────────┤
│                                 │
│  TAB 0 — MILK ENTRIES           │
│  ┌─────────────────────────┐    │
│  │  ➕  Add Milk Entry     │    │
│  └─────────────────────────┘    │
│  [MilkEntryRow] 01/05  14.3L   │
│  [MilkEntryRow] 02/05  17.4L   │
│  [MilkEntryRow] 03/05  14.7L   │
│  [View All Entries →]           │
│                                 │
│  TAB 1 — PAYMENTS               │
│  Period: 01/05–15/05            │
│  Net: Rs. 43,094.22             │
│  [View Payment Advice →]        │
│                                 │
│  TAB 2 — STATS                  │
│  [Monthly Bar Chart]            │
│  Total Litres This Month: 230L  │
│  Avg FAT: 5.57% | SNF: 8.47%   │
└─────────────────────────────────┘
```

#### State Variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `farmer` | Object | `null` | Full farmer profile |
| `milkEntries` | Array | `[]` | Last 5 milk entries |
| `payments` | Array | `[]` | All generated payments |
| `stats` | Object | `{}` | Monthly aggregated stats |
| `activeTab` | Number | `0` | Current active tab (0/1/2) |
| `loading` | Boolean | `true` | Initial data load |
| `showDeleteModal` | Boolean | `false` | Delete confirmation modal |

#### Tab Descriptions

| Tab | Content |
|-----|---------|
| Milk Entries (0) | Last 5 entries + "Add Entry" button + "View All" link |
| Payments (1) | List of generated payment advice cards + "Generate" button |
| Stats (2) | Bar chart of monthly litres, avg FAT/SNF, total amounts |

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| Edit farmer | ✏️ icon in header | Navigate to `FarmerRegister` with farmer data |
| Delete farmer | ⋮ menu → Delete | Show `ConfirmModal` → `DELETE /farmers/:id` → go back |
| Add milk entry | Button in Entries tab | Navigate to `MilkEntry` with `{ farmerId }` |
| View all entries | Link in Entries tab | Navigate to `MilkEntryList` with `{ farmerId }` |
| View payment | Payment card press | Navigate to `PaymentAdvice` with `{ paymentId }` |
| Generate advice | Button in Payments tab | Navigate to `MilkEntryList` with generate flag |

---

### Screen 6: Milk Entry Add / Edit
**File:** `src/screens/MilkEntryScreen.jsx`

#### Purpose
Form screen for recording a single day's milk collection for a farmer. Automatically calculates the payment amount in real time as the user types in Litres, FAT %, and SNF %.

#### UI Layout
```
┌─────────────────────────────────┐
│ ←  Add Milk Entry               │
├─────────────────────────────────┤
│  👤 Duminda Lakmal              │
│     FMS No: 763                 │
├─────────────────────────────────┤
│  COLLECTION DETAILS             │
│                                 │
│  Collection Date *              │
│  ┌─────────────────────────┐    │
│  │  📅  26 / May / 2026   │    │
│  └─────────────────────────┘    │
│                                 │
│  Receipt Number *               │
│  ┌─────────────────────────┐    │
│  │  237222                 │    │
│  └─────────────────────────┘    │
│                                 │
│  Litres / KG *                  │
│  ┌─────────────────────────┐    │
│  │  14.30                  │    │
│  └─────────────────────────┘    │
│                                 │
│  QUALITY PARAMETERS             │
│                                 │
│  FAT %            SNF %         │
│  ┌───────────┐  ┌───────────┐   │
│  │   5.90    │  │   8.66    │   │
│  └───────────┘  └───────────┘   │
│                                 │
│  PAYMENT CALCULATION            │
│                                 │
│  Rate per Litre (auto-calc)     │
│  ┌─────────────────────────┐    │
│  │  198.78  ✏️             │    │
│  └─────────────────────────┘    │
│                                 │
│  Amount (Rs.)  — Read Only      │
│  ┌─────────────────────────┐    │
│  │  Rs. 2,842.55           │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │    💾  Save Entry       │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

#### Form Fields Reference

| Field | Required | Input Type | Note |
|-------|:--------:|------------|------|
| Date | ✅ | Date Picker | Default: today |
| Receipt No | ✅ | Text | Unique identifier |
| Litres / KG | ✅ | Numeric decimal | Must be > 0 |
| FAT % | ✅ | Numeric decimal | e.g. 5.90 |
| SNF % | ✅ | Numeric decimal | e.g. 8.66 |
| Rate per Litre | ✅ | Numeric (auto) | Auto-calculated, manually overridable |
| Amount (Rs.) | Calculated | Read-Only | `litresKg × rate` |

#### State Variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `formData.date` | Date | `new Date()` | Collection date |
| `formData.receiptNo` | String | `""` | Receipt number |
| `formData.litresKg` | String | `""` | Volume |
| `formData.fat` | String | `""` | FAT percentage |
| `formData.snf` | String | `""` | SNF percentage |
| `formData.rate` | String | `""` | Rate (auto-filled) |
| `formData.rupees` | Number | `0` | Calculated amount |
| `errors` | Object | `{}` | Validation errors |
| `loading` | Boolean | `false` | Submit state |
| `isEditMode` | Boolean | `false` | Edit mode flag |

#### Auto-Calculation
Triggered on every change to `litresKg`, `fat`, or `snf`:
```js
useEffect(() => {
  if (formData.litresKg && formData.fat && formData.snf) {
    const calculatedRate = calculateRate(parseFloat(formData.fat), parseFloat(formData.snf), settings);
    const calculatedRupees = calculateRupees(parseFloat(formData.litresKg), calculatedRate);
    setFormData(prev => ({ ...prev, rate: calculatedRate.toString(), rupees: calculatedRupees }));
  }
}, [formData.litresKg, formData.fat, formData.snf]);
```

---

### Screen 7: Milk Entry List
**File:** `src/screens/MilkEntryListScreen.jsx`

#### Purpose
View all milk collection entries for a specific farmer over a selectable date range. Shows a running total at the bottom. The primary launch point for generating a payment advice.

#### UI Layout
```
┌─────────────────────────────────┐
│ ← Milk Entries                  │
│   Duminda Lakmal — FMS: 763     │
├─────────────────────────────────┤
│  FROM  [01/05/2026]             │
│  TO    [15/05/2026]  [Apply]    │
├─────────────────────────────────┤
│ Date   Rcpt    L    FAT   Rs.   │
│ ──────────────────────────────  │
│ 01/05  237222 14.3  5.9  2,842  │
│ 02/05  237308 17.4  6.0  3,455  │
│ 03/05  237369 14.7  5.4  2,685  │
│  ...                            │
│ ──────────────────────────────  │
│ TOTAL       230.3  5.57 43,119  │
├─────────────────────────────────┤
│  SUMMARY                        │
│  Total Litres:    230.30 L      │
│  Average FAT:     5.57 %        │
│  Average SNF:     8.47 %        │
│  Gross Amount: Rs. 43,119.22    │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 📄 Generate Payment Advice  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### State Variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `entries` | Array | `[]` | Filtered milk entries |
| `fromDate` | Date | 1st of current month | Period start |
| `toDate` | Date | 15th of current month | Period end |
| `totals` | Object | `{}` | Aggregated totals |
| `loading` | Boolean | `true` | Fetch state |

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| Load entries | Mount or date filter change | `GET /milk-entries/farmer/:id?from=&to=` |
| Edit entry | Row tap | Navigate to `MilkEntry` (edit mode) |
| Delete entry | Swipe left on row | Show `ConfirmModal` → `DELETE /milk-entries/:id` |
| Generate advice | Bottom button | `POST /payments/generate` → Navigate to `PaymentAdvice` |

---

### Screen 8: Payment Advice
**File:** `src/screens/PaymentAdviceScreen.jsx`

#### Purpose
Displays the complete, formatted payment advice document matching the official MILCO Payment Advice slip. Supports printing and sharing as a PDF.

#### UI Layout (mirrors the MILCO document format)
```
┌─────────────────────────────────┐
│ ← Payment Advice      [📤 Share]│
├─────────────────────────────────┤
│  REP005    MILCO (PVT) LTD.     │
│  MILK PAYMENT ADVICE            │
│  Period: 26/05/01 - 26/05/15   │
│  Region: UVA   Centre: WELLAWAYA│
│  ─────────────────────────────  │
│  Supplier No: 763               │
│  U A D M DUMINDA LAKMAL         │
│  Wewapara                       │
│  Unawatuna                      │
│  Buttala                        │
├─────────────────────────────────┤
│ Date  Rcpt   L   FAT SNF Rt Rs  │
│ ─────────────────────────────── │
│ 01/05 237222 14.3 5.9 8.66 2842 │
│ 02/05 237308 17.4 6.0 8.54 3455 │
│  ...                            │
│ ─────────────────────────────── │
│ **TOTAL  230.3  5.57 8.47 43119 │
│ ═══════════════════════════════ │
├─────────────────────────────────┤
│  STAMP DUTY              25.00  │
│ *** NET AMOUNT   Rs. 43,094.22  │
├─────────────────────────────────┤
│  Credited to account:           │
│  000501010102086                │
│  REGIONAL DEVELOPMENT BANK      │
│  BUTTALA                        │
├─────────────────────────────────┤
│ [🖨️ Print]     [📤 Share PDF]  │
└─────────────────────────────────┘
```

#### State Variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `payment` | Object | `null` | Full payment object with entries |
| `farmer` | Object | `null` | Farmer profile |
| `loading` | Boolean | `true` | Data loading |
| `sharing` | Boolean | `false` | Share/print in progress |

#### Actions

| Action | Trigger | Outcome |
|--------|---------|---------|
| Load payment | Mount | `GET /payments/:id` |
| Print | Print button | Generate HTML string → `expo-print` |
| Share | Share button | HTML → PDF via `expo-print` → `expo-sharing` |

#### Print HTML Generation (summary)
The screen builds an HTML string that mirrors the MILCO document layout (monospace font, aligned columns, separator lines). Uses `expo-print` to convert the HTML to a shareable/printable PDF.

---

### Screen 9: Reports
**File:** `src/screens/ReportScreen.jsx`

#### Purpose
Analytics and summary reporting screen. Shows aggregated data for all farmers (or a selected farmer) over a chosen period. Includes a bar chart for monthly milk volume and a top-farmers ranking table.

#### UI Layout
```
┌─────────────────────────────────┐
│ 📊 Reports                      │
├─────────────────────────────────┤
│  Period                         │
│  FROM: [01/05/2026]             │
│  TO:   [31/05/2026]             │
│  Farmer: [All Farmers        ▼] │
│                    [Generate]   │
├─────────────────────────────────┤
│  SUMMARY                        │
│ ┌────────┐┌─────────┐┌────────┐ │
│ │  12    ││ 4,560 L ││Rs.3.2M│ │
│ │ Farmers││  Milk   ││Payments│ │
│ └────────┘└─────────┘└────────┘ │
├─────────────────────────────────┤
│  Monthly Milk Volume (Litres)   │
│  ████ ███ ████ ████             │
│  May   Jun  Jul  Aug            │
├─────────────────────────────────┤
│  TOP FARMERS — THIS PERIOD      │
│  1. Duminda Lakmal   4,230 L    │
│  2. Farmer B         3,120 L    │
│  3. Farmer C         2,890 L    │
├─────────────────────────────────┤
│  [📥 Export CSV]                │
└─────────────────────────────────┘
```

#### State Variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `fromDate` | Date | Start of current month | Filter period start |
| `toDate` | Date | End of current month | Filter period end |
| `selectedFarmerId` | Number/null | `null` (all farmers) | Farmer filter |
| `farmers` | Array | `[]` | Dropdown population |
| `reportData` | Object | `null` | API response data |
| `loading` | Boolean | `false` | Report generation loading |

#### API Calls
```js
GET /api/farmers
GET /api/reports/summary?from=2026-05-01&to=2026-05-31&farmerId=1
```

---

### Screen 10: Settings
**File:** `src/screens/SettingsScreen.jsx`

#### Purpose
Configure application-wide settings — company name, region, collection centre defaults, stamp duty amount, and rate calculation parameters. These values are stored in the `SystemSettings` table on the backend.

#### UI Layout
```
┌─────────────────────────────────┐
│ ⚙️ Settings                     │
├─────────────────────────────────┤
│  COMPANY SETTINGS               │
│                                 │
│  Company Name                   │
│  ┌─────────────────────────┐    │
│  │ MILCO (Private) Limited │    │
│  └─────────────────────────┘    │
│                                 │
│  Default Region                 │
│  ┌─────────────────────────┐    │
│  │ UVA                     │    │
│  └─────────────────────────┘    │
│                                 │
│  Default Centre                 │
│  ┌─────────────────────────┐    │
│  │ WELLAWAYA               │    │
│  └─────────────────────────┘    │
│                                 │
├─────────────────────────────────┤
│  PAYMENT SETTINGS               │
│                                 │
│  Stamp Duty (Rs.)               │
│  ┌─────────────────────────┐    │
│  │ 25.00                   │    │
│  └─────────────────────────┘    │
│                                 │
│  Base Rate per Litre (Rs.)      │
│  ┌─────────────────────────┐    │
│  │ 180.00                  │    │
│  └─────────────────────────┘    │
│                                 │
│  FAT Premium (Rs. per 0.1%)     │
│  ┌─────────────────────────┐    │
│  │ 2.50                    │    │
│  └─────────────────────────┘    │
│                                 │
│  SNF Premium (Rs. per 0.1%)     │
│  ┌─────────────────────────┐    │
│  │ 1.80                    │    │
│  └─────────────────────────┘    │
│                                 │
├─────────────────────────────────┤
│  ABOUT                          │
│  App Version: 1.0.0             │
│  Highland Farmers Salary        │
│  Developed by BIZmaster Solutions│
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │      💾  Save Settings      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### Configurable Settings

| Key | Description | Default |
|-----|-------------|---------|
| `company_name` | Dairy company name | MILCO (Private) Limited |
| `default_region` | Default region for new farmers | UVA |
| `default_centre` | Default collection centre | WELLAWAYA |
| `stamp_duty` | Stamp duty deducted per payment | 25.00 |
| `base_rate` | Base rate per litre (Rs.) | 180.00 |
| `std_fat` | Standard FAT % for base rate | 4.00 |
| `std_snf` | Standard SNF % for base rate | 8.00 |
| `fat_premium` | Rs. added per 0.1% FAT above standard | 2.50 |
| `snf_premium` | Rs. added per 0.1% SNF above standard | 1.80 |

---

## 9. Reusable Components — All 12

---

### `CustomInput.jsx`

**Purpose:** Standardised text input field with label, optional asterisk for required fields, and inline error message below the input.

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `label` | String | ✅ | — | Label shown above the field |
| `value` | String | ✅ | — | Controlled input value |
| `onChangeText` | Function | ✅ | — | Called on every keystroke |
| `placeholder` | String | ❌ | `""` | Placeholder text inside field |
| `error` | String | ❌ | `null` | Error message shown in red below field |
| `keyboardType` | String | ❌ | `"default"` | `numeric`, `email-address`, `phone-pad` |
| `multiline` | Boolean | ❌ | `false` | Enable multiline text area |
| `numberOfLines` | Number | ❌ | `1` | Height in lines when multiline |
| `secureTextEntry` | Boolean | ❌ | `false` | Mask input (for passwords) |
| `editable` | Boolean | ❌ | `true` | False makes the field read-only |
| `required` | Boolean | ❌ | `false` | Appends `*` after the label |
| `rightIcon` | Element | ❌ | `null` | Icon component inside right side of input |

```jsx
// Usage example
<CustomInput
  label="FMS Number"
  value={formData.fmsNo}
  onChangeText={(text) => setFormData({ ...formData, fmsNo: text })}
  placeholder="e.g. 763"
  error={errors.fmsNo}
  required
/>
```

---

### `CustomButton.jsx`

**Purpose:** Standardised button with multiple visual styles, icon support, loading spinner, and disabled state.

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `title` | String | ✅ | — | Button label text |
| `onPress` | Function | ✅ | — | Press handler |
| `variant` | String | ❌ | `"primary"` | `primary`, `secondary`, `danger`, `outline`, `ghost` |
| `loading` | Boolean | ❌ | `false` | Show spinner, disable press |
| `disabled` | Boolean | ❌ | `false` | Greyed-out disabled state |
| `icon` | String | ❌ | `null` | MaterialIcons icon name |
| `fullWidth` | Boolean | ❌ | `true` | Stretch to container width |
| `size` | String | ❌ | `"medium"` | `small`, `medium`, `large` |

**Variants:**
- `primary` — Solid green background (main action)
- `secondary` — Solid grey background (secondary action)
- `danger` — Solid red background (destructive action)
- `outline` — Green border, transparent background
- `ghost` — No background or border, green text only

```jsx
<CustomButton
  title="Save Farmer"
  onPress={handleSave}
  variant="primary"
  loading={loading}
  icon="save"
/>
<CustomButton
  title="Delete"
  onPress={handleDelete}
  variant="danger"
  icon="delete"
/>
```

---

### `FarmerCard.jsx`

**Purpose:** Card component displaying a farmer's key information in list views and on the dashboard.

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `farmer` | Object | ✅ | — | Farmer data object |
| `onPress` | Function | ✅ | — | Navigate to FarmerDetail |
| `onEdit` | Function | ❌ | `null` | Edit icon handler |
| `onDelete` | Function | ❌ | `null` | Delete icon handler |
| `showActions` | Boolean | ❌ | `true` | Show edit/delete action icons |
| `compact` | Boolean | ❌ | `false` | Compact layout for dashboard |

**Farmer object shape:**
```js
{
  id: 1,
  fmsNo: "763",
  fmsName: "U A D M DUMINDA LAKMAL",
  name: "Duminda Lakmal",
  address: "Wewapara, Unawatuna, Buttala",
  region: "UVA",
  centre: "WELLAWAYA",
  isActive: true
}
```

---

### `MilkEntryRow.jsx`

**Purpose:** Single table row in the milk entry list, showing one day's collection data. Supports header and total row variants.

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `entry` | Object | ✅ | — | Milk entry data |
| `index` | Number | ❌ | `0` | Row index for alternating row colours |
| `onEdit` | Function | ❌ | `null` | Called when row is tapped |
| `onDelete` | Function | ❌ | `null` | Called on swipe-to-delete confirm |
| `isTotal` | Boolean | ❌ | `false` | Bold styling for the TOTAL row |
| `isHeader` | Boolean | ❌ | `false` | Bold header row (Date / Rcpt / Litres etc.) |

---

### `StatCard.jsx`

**Purpose:** Small metric display card used on the dashboard and in reports to highlight key numbers.

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `title` | String | ✅ | — | Metric label (e.g. "Total Farmers") |
| `value` | String/Number | ✅ | — | The numeric or text value |
| `icon` | String | ❌ | `null` | MaterialIcons icon name |
| `color` | String | ❌ | `"#4CAF50"` | Card accent colour |
| `subtitle` | String | ❌ | `null` | Small secondary text |
| `onPress` | Function | ❌ | `null` | Navigate on card tap |
| `prefix` | String | ❌ | `null` | Text before value (e.g. `"Rs."`) |

```jsx
<StatCard title="Total Farmers" value={12} icon="people" color="#4CAF50" />
<StatCard title="Monthly Payment" value="43,094.22" prefix="Rs." icon="payments" color="#1565C0" />
```

---

### `PaymentAdviceTable.jsx`

**Purpose:** Renders the full payment advice table in MILCO document format. Used inside `PaymentAdviceScreen` for display and also for generating the print HTML.

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `payment` | Object | ✅ | — | Full payment object including `.entries[]` |
| `farmer` | Object | ✅ | — | Farmer profile data |
| `companyName` | String | ❌ | `"MILCO (PVT) LTD."` | Header company name |
| `showPrintHeader` | Boolean | ❌ | `false` | Include REP005 monospace header row |

**Payment object shape:**
```js
{
  id: 1,
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  entries: [ /* array of MilkEntry objects */ ],
  totalLitres: 230.30,
  avgFat: 5.57,
  avgSnf: 8.47,
  grossAmount: 43119.22,
  stampDuty: 25.00,
  netAmount: 43094.22,
  bankAccount: "000501010102086",
  bankName: "Regional Development Bank, Buttala"
}
```

---

### `LoadingSpinner.jsx`

**Purpose:** Centred or overlay loading indicator shown during API calls and data processing.

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `visible` | Boolean | ✅ | — | Show or hide the spinner |
| `message` | String | ❌ | `"Loading..."` | Text shown below spinner |
| `overlay` | Boolean | ❌ | `false` | Semi-transparent full-screen overlay |
| `size` | String | ❌ | `"large"` | `"small"` or `"large"` |
| `color` | String | ❌ | `"#2E7D32"` | Spinner tint colour |

---

### `EmptyState.jsx`

**Purpose:** Full-screen placeholder displayed when a list is empty — no farmers registered, no milk entries for a period, etc.

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `title` | String | ✅ | — | Bold heading (e.g. "No Farmers Yet") |
| `message` | String | ❌ | `null` | Descriptive sub-text |
| `actionLabel` | String | ❌ | `null` | Call-to-action button label |
| `onAction` | Function | ❌ | `null` | Call-to-action handler |
| `icon` | String | ❌ | `"inbox"` | MaterialIcons icon name |

```jsx
<EmptyState
  title="No Milk Entries"
  message="No entries recorded for this period. Add the first entry below."
  actionLabel="Add Milk Entry"
  onAction={() => navigation.navigate('MilkEntry', { farmerId })}
  icon="water-drop"
/>
```

---

### `DatePickerComponent.jsx`

**Purpose:** Cross-platform date picker. On iOS, shows a modal spinner. On Android, uses the native date picker dialog. Both platforms receive the selected `Date` object via `onChange`.

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `value` | Date | ✅ | — | Current selected date |
| `onChange` | Function | ✅ | — | Called with the selected `Date` |
| `label` | String | ❌ | `"Date"` | Label above the display |
| `minimumDate` | Date | ❌ | `null` | Earliest selectable date |
| `maximumDate` | Date | ❌ | `new Date()` | Latest selectable date (default: today) |
| `mode` | String | ❌ | `"date"` | `"date"`, `"time"`, or `"datetime"` |
| `error` | String | ❌ | `null` | Validation error message |

---

### `Header.jsx`

**Purpose:** Custom screen header used in place of React Navigation's default header. Provides consistent back button, title, optional subtitle, and right-side action icons.

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `title` | String | ✅ | — | Main header title |
| `showBack` | Boolean | ❌ | `true` | Show the back arrow |
| `onBack` | Function | ❌ | `navigation.goBack()` | Custom back handler |
| `subtitle` | String | ❌ | `null` | Secondary text below title |
| `rightAction` | Object | ❌ | `null` | `{ icon, onPress, label }` single action |
| `rightActions` | Array | ❌ | `[]` | Multiple right-side actions |

```jsx
<Header
  title="Farmer Details"
  subtitle="FMS: 763"
  rightActions={[
    { icon: 'edit', onPress: handleEdit },
    { icon: 'more-vert', onPress: openMenu }
  ]}
/>
```

---

### `SectionHeader.jsx`

**Purpose:** Horizontal divider with a bold section label and an optional "View All" or action link on the right. Used to separate content blocks within scrollable screens.

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `title` | String | ✅ | — | Section heading text |
| `actionLabel` | String | ❌ | `null` | Right-side link text (e.g. "View All") |
| `onAction` | Function | ❌ | `null` | Right-side link handler |
| `count` | Number | ❌ | `null` | Badge number shown next to title |

```jsx
<SectionHeader
  title="Milk Entries"
  actionLabel="View All"
  onAction={() => navigation.navigate('MilkEntryList', { farmerId })}
  count={15}
/>
```

---

### `ConfirmModal.jsx`

**Purpose:** Confirmation dialog shown before any destructive or irreversible action (delete farmer, delete milk entry, regenerate payment). Blocks the action until the user explicitly confirms.

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `visible` | Boolean | ✅ | — | Show/hide modal |
| `title` | String | ✅ | — | Modal heading |
| `message` | String | ❌ | `null` | Body text explaining the action |
| `onConfirm` | Function | ✅ | — | Called on confirm press |
| `onCancel` | Function | ✅ | — | Called on cancel / backdrop press |
| `confirmText` | String | ❌ | `"Confirm"` | Confirm button label |
| `cancelText` | String | ❌ | `"Cancel"` | Cancel button label |
| `type` | String | ❌ | `"warning"` | `"danger"` (red), `"warning"` (amber), `"info"` (blue) |
| `loading` | Boolean | ❌ | `false` | Spinner on confirm button during API call |

```jsx
<ConfirmModal
  visible={showDeleteModal}
  title="Delete Farmer"
  message="This will permanently delete Duminda Lakmal and all their milk entries and payment history. This cannot be undone."
  onConfirm={handleDeleteConfirm}
  onCancel={() => setShowDeleteModal(false)}
  confirmText="Delete"
  type="danger"
  loading={loading}
/>
```

---

## 10. API Service Layer

**File:** `src/api/apiService.js`

```js
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Response/error interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || 'Network error. Please check your connection.';
    return Promise.reject(new Error(message));
  }
);

// ── Farmer API ────────────────────────────────────────────────────

export const farmerApi = {
  getAll: (params = {}) => api.get('/farmers', { params }),
  getById: (id) => api.get(`/farmers/${id}`),
  create: (data) => api.post('/farmers', data),
  update: (id, data) => api.put(`/farmers/${id}`, data),
  delete: (id) => api.delete(`/farmers/${id}`),
};

// ── Milk Entry API ────────────────────────────────────────────────

export const milkEntryApi = {
  getByFarmer: (farmerId, params = {}) =>
    api.get(`/milk-entries/farmer/${farmerId}`, { params }),
  create: (data) => api.post('/milk-entries', data),
  update: (id, data) => api.put(`/milk-entries/${id}`, data),
  delete: (id) => api.delete(`/milk-entries/${id}`),
};

// ── Payment API ───────────────────────────────────────────────────

export const paymentApi = {
  getByFarmer: (farmerId) => api.get(`/payments/farmer/${farmerId}`),
  getById: (id) => api.get(`/payments/${id}`),
  generate: (data) => api.post('/payments/generate', data),
  delete: (id) => api.delete(`/payments/${id}`),
};

// ── Report API ────────────────────────────────────────────────────

export const reportApi = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getFarmerReport: (farmerId, params) =>
    api.get(`/reports/farmer/${farmerId}`, { params }),
  getDashboardStats: () => api.get('/dashboard/stats'),
};

// ── Settings API ──────────────────────────────────────────────────

export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};
```

**File:** `src/constants/config.js`

```js
// ⚠️ Change this to your server's local IP address
// Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your IP
export const API_BASE_URL = 'http://192.168.1.100:3000/api';

export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Highland Farmers Salary';
export const DEFAULT_STAMP_DUTY = 25.00;
```

---

## 11. Milk Rate Calculation Logic

The rate per litre is determined by milk quality — specifically **FAT %** and **SNF % (Solids-Not-Fat %)**. The formula used is a **quality-based incentive pricing model** common across Sri Lanka's dairy cooperatives.

### Rate Formula

```
Rate = Base Rate
     + ((FAT  - Standard FAT)  / 0.1) × FAT  Premium
     + ((SNF  - Standard SNF)  / 0.1) × SNF  Premium
```

### Parameters (configurable in Settings)

| Parameter | Symbol | Default |
|-----------|--------|---------|
| Base Rate per litre | — | Rs. 180.00 |
| Standard FAT % | std_fat | 4.00% |
| Standard SNF % | std_snf | 8.00% |
| FAT Premium (per 0.1% above standard) | fat_premium | Rs. 2.50 |
| SNF Premium (per 0.1% above standard) | snf_premium | Rs. 1.80 |

### Worked Example (26/05/01)
```
FAT = 5.90%  |  SNF = 8.66%  |  Litres = 14.30

FAT Units above standard = (5.90 - 4.00) / 0.1 = 19 units
SNF Units above standard = (8.66 - 8.00) / 0.1 = 6.6 units

FAT Bonus = 19   × Rs. 2.50 = Rs. 47.50
SNF Bonus = 6.6  × Rs. 1.80 = Rs. 11.88

Rate  = 180.00 + 47.50 + 11.88 = Rs. 239.38
Amount = 14.30 × Rate = Rs. 3,423.15
```

> **Note:** The actual MILCO rate table may use a different formula or lookup table. The base rate and premium values shown above are examples. The Settings screen allows the centre manager to calibrate these values to match the official MILCO pricing in effect.

### Calculation Utility — `src/utils/calculations.js`

```js
/**
 * Calculate the per-litre rate from FAT% and SNF%.
 * @param {number} fat - FAT percentage (e.g. 5.90)
 * @param {number} snf - SNF percentage (e.g. 8.66)
 * @param {object} settings - App settings from backend
 * @returns {number} Rate per litre in Rs.
 */
export function calculateRate(fat, snf, settings = {}) {
  const BASE_RATE   = parseFloat(settings.base_rate   ?? 180.00);
  const STD_FAT     = parseFloat(settings.std_fat     ?? 4.00);
  const STD_SNF     = parseFloat(settings.std_snf     ?? 8.00);
  const FAT_PREMIUM = parseFloat(settings.fat_premium ?? 2.50);
  const SNF_PREMIUM = parseFloat(settings.snf_premium ?? 1.80);

  const fatBonus = ((fat - STD_FAT) / 0.1) * FAT_PREMIUM;
  const snfBonus = ((snf - STD_SNF) / 0.1) * SNF_PREMIUM;
  const rate     = BASE_RATE + fatBonus + snfBonus;

  return Math.round(rate * 100) / 100;
}

/**
 * Calculate payment amount in Rs.
 * @param {number} litresKg - Volume collected
 * @param {number} rate     - Rate per litre
 * @returns {number} Amount in Rs.
 */
export function calculateRupees(litresKg, rate) {
  return Math.round(litresKg * rate * 100) / 100;
}

/**
 * Aggregate totals across an array of milk entries.
 * @param {Array} entries - Array of MilkEntry objects
 * @returns {object} { totalLitres, totalRupees, avgFat, avgSnf }
 */
export function calculateTotals(entries) {
  if (!entries || entries.length === 0)
    return { totalLitres: 0, totalRupees: 0, avgFat: 0, avgSnf: 0 };

  const totalLitres = entries.reduce((s, e) => s + e.litresKg, 0);
  const totalRupees = entries.reduce((s, e) => s + e.rupees,   0);
  const avgFat      = entries.reduce((s, e) => s + e.fat,      0) / entries.length;
  const avgSnf      = entries.reduce((s, e) => s + e.snf,      0) / entries.length;

  return {
    totalLitres: Math.round(totalLitres * 100) / 100,
    totalRupees: Math.round(totalRupees * 100) / 100,
    avgFat:      Math.round(avgFat      * 100) / 100,
    avgSnf:      Math.round(avgSnf      * 100) / 100,
  };
}

/**
 * Deduct stamp duty to get net payment.
 * @param {number} grossAmount
 * @param {number} stampDuty (default Rs. 25)
 * @returns {number} Net amount
 */
export function calculateNetAmount(grossAmount, stampDuty = 25.00) {
  return Math.round((grossAmount - stampDuty) * 100) / 100;
}
```

---

## 12. Sample Data — From MILCO Payment Advice

The data below is extracted from the uploaded MILCO Milk Payment Advice document and is used to seed/test the application.

### Farmer (Supplier)

| Field | Value |
|-------|-------|
| FMS No | 763 |
| FMS Name | U A D M DUMINDA LAKMAL |
| Display Name | Duminda Lakmal |
| Address | Wewapara, Unawatuna, Buttala |
| Region | UVA |
| Centre | WELLAWAYA |
| Bank Account | 000501010102086 |
| Bank | Regional Development Bank, Buttala |

### Milk Entries — Period: 26/05/01 to 26/05/15

| Date | Rcpt No | Litres | FAT % | SNF % | Rate (Rs.) | Amount (Rs.) |
|------|---------|-------:|------:|------:|----------:|-------------:|
| 26/05/01 | 237222 | 14.30 | 5.90 | 8.66 | 198.78 | 2,842.55 |
| 26/05/02 | 237308 | 17.40 | 6.00 | 8.54 | 198.62 | 3,455.99 |
| 26/05/03 | 237369 | 14.70 | 5.40 | 8.43 | 182.66 | 2,685.10 |
| 26/05/04 | 237424 | 14.40 | 5.20 | 8.46 | 181.15 | 2,608.56 |
| 26/05/05 | 237488 | 16.90 | 5.30 | 8.43 | 181.77 | 3,071.91 |
| 26/05/06 | 237544 | 15.10 | 5.40 | 8.34 | 181.87 | 2,746.24 |
| 26/05/07 | 237605 | 14.50 | 5.30 | 8.61 | 183.36 | 2,658.72 |
| 26/05/08 | 237665 | 16.30 | 5.00 | 8.54 | 180.06 | 2,934.98 |
| 26/05/09 | 237725 | 14.40 | 6.00 | 8.34 | 187.00 | 2,692.80 |
| 26/05/10 | 237787 | 15.10 | 6.20 | 8.38 | 198.94 | 3,003.99 |
| 26/05/11 | 237846 | 15.10 | 5.50 | 8.43 | 183.53 | 2,771.30 |
| 26/05/12 | 237910 | 24.90 | 5.60 | 8.47 | 184.74 | 4,600.03 |
| 26/05/13 | 237971 | 15.00 | 5.80 | 8.55 | 185.41 | 2,781.15 |
| 26/05/14 | 238037 | 14.70 | 5.40 | 8.40 | 182.39 | 2,681.13 |
| 26/05/15 | 238097 | 14.50 | 6.10 | 8.56 | 199.57 | 2,893.77 |

### Payment Summary

| Field | Value |
|-------|-------|
| **Total Litres** | **230.30 L** |
| **Average FAT %** | **5.57 %** |
| **Average SNF %** | **8.47 %** |
| **Gross Amount** | **Rs. 43,119.22** |
| Stamp Duty | Rs. 25.00 |
| **Net Amount** | **Rs. 43,094.22** |

---

## 13. Environment Variables

### Backend — `backend/.env`
```env
DATABASE_URL="file:./prisma/farmers.db"
PORT=3000
NODE_ENV=development
```

### Mobile — `mobile/src/constants/config.js`
```js
// Development: Use your machine's local network IP address.
// To find it: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
// Make sure your phone and PC are on the same Wi-Fi network.

export const API_BASE_URL = 'http://192.168.1.100:3000/api';

// Production (when deployed to a cloud server):
// export const API_BASE_URL = 'https://your-api.example.com/api';
```

---

## 14. Setup & Installation Guide

### Prerequisites

| Requirement | Version | Check |
|------------|---------|-------|
| Node.js | 18 or higher | `node -v` |
| npm or yarn | Latest | `npm -v` |
| Expo CLI | Latest | `npx expo --version` |
| Expo Go app | Latest | Install on your phone from Play Store / App Store |

---

### Step 1 — Create Project Folders

```bash
mkdir highland-farmers-salary
cd highland-farmers-salary
mkdir backend mobile
```

### Step 2 — Set Up the Backend

```bash
cd backend

# Initialise Node.js project
npm init -y

# Install all backend dependencies
npm install express @prisma/client cors dotenv express-validator
npm install prisma --save-dev

# Initialise Prisma with SQLite
npx prisma init --datasource-provider sqlite
```

Paste the schema from Section 5 into `prisma/schema.prisma`, then:

```bash
# Create the database and run initial migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

Create `server.js`:
```js
require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Highland Farmers API running on http://0.0.0.0:${PORT}`);
});
```

Create `src/app.js`:
```js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mount all route files
app.use('/api/farmers',      require('./routes/farmerRoutes'));
app.use('/api/milk-entries', require('./routes/milkEntryRoutes'));
app.use('/api/payments',     require('./routes/paymentRoutes'));
app.use('/api/reports',      require('./routes/reportRoutes'));
app.use('/api/settings',     require('./routes/settingsRoutes'));
app.use('/api/dashboard',    require('./routes/dashboardRoutes'));

module.exports = app;
```

### Step 3 — Seed Sample Data

Create `prisma/seed.js` with the data from Section 12 and run:
```bash
node prisma/seed.js
```

### Step 4 — Start the Backend

```bash
cd backend
node server.js
# ✅ Highland Farmers API running on http://0.0.0.0:3000
```

Verify it works — open a browser and go to:
```
http://localhost:3000/api/farmers
```
Expected: `{ "success": true, "data": [] }`

---

### Step 5 — Set Up the Mobile App

```bash
cd mobile

# Create a blank Expo app in this folder
npx create-expo-app . --template blank

# Navigation
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# HTTP client
npm install axios

# UI components
npm install react-native-paper @expo/vector-icons

# Date picker
npm install @react-native-community/datetimepicker

# Charts
npm install react-native-chart-kit react-native-svg

# Print & share
npm install expo-print expo-sharing
```

### Step 6 — Configure the API URL

Find your computer's local IP address:
```bash
# Windows
ipconfig

# Mac / Linux
ifconfig
```

Open `src/constants/config.js` and update:
```js
export const API_BASE_URL = 'http://YOUR_IP_HERE:3000/api';
//  Example: 'http://192.168.1.45:3000/api'
```

⚠️ Your phone and computer must be on the **same Wi-Fi network**.

### Step 7 — Start the Mobile App

```bash
cd mobile
npx expo start
```

| Platform | How to run |
|----------|-----------|
| Android physical device | Scan QR code with **Expo Go** app |
| iOS physical device | Scan QR code with **Expo Go** app (Camera app) |
| Android emulator | Press `a` in the terminal |
| iOS simulator | Press `i` in the terminal (Mac only) |

---

## 15. Color Theme

**File:** `src/constants/colors.js`

```js
export const COLORS = {
  // Brand greens
  primary:        '#2E7D32',   // Dark green — primary buttons, header
  primaryLight:   '#4CAF50',   // Medium green — active states, icons
  primaryPale:    '#E8F5E9',   // Very light green — card backgrounds, highlights

  // Supporting
  secondary:      '#1565C0',   // Blue — secondary actions, links
  danger:         '#C62828',   // Red — delete, errors
  warning:        '#F57F17',   // Amber — warnings, caution
  success:        '#2E7D32',   // Green — success toasts

  // Text
  text:           '#212121',   // Primary body text
  textSecondary:  '#757575',   // Labels, captions
  textDisabled:   '#BDBDBD',   // Disabled text

  // UI Structure
  border:         '#E0E0E0',   // Input borders, dividers
  background:     '#F5F5F5',   // Screen background
  surface:        '#FFFFFF',   // Card / modal surface
  shadow:         '#000000',   // Box shadow colour

  // Utility
  white:          '#FFFFFF',
  black:          '#000000',
  transparent:    'transparent',
};
```

---

## 📦 Package.json Quick Reference

### Backend (`backend/package.json`)
```json
{
  "name": "highland-farmers-salary-api",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "npx prisma migrate dev",
    "seed": "node prisma/seed.js",
    "studio": "npx prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "express-validator": "^7.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "nodemon": "^3.0.0"
  }
}
```

---

*Highland Farmers Salary — Built for Sri Lanka's Dairy Farming Community*

*Version 1.0.0 | © 2026 BIZmaster Solutions*