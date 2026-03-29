# 🎨 LorryLink: UI/UX Layout Specification

This document provides a breakdown of the design language, layout structures, and user experience flows implemented in the LorryLink platform.

## 1. Design System & Aesthetics
LorryLink follows a **Premium Dark Glassmorphism** aesthetic, designed to reduce eye strain for drivers and provide a state-of-the-art feel for shippers.

- **Background**: Deep Indigo/Black (`#0A0C14`)
- **Glass Effect**: Semi-transparent overlays with backdrop-blurs (`backdrop-filter: blur(12px)`)
- **Primary Color**: Vivid Royal Blue (`#3B82F6`) — used for actions and focus.
- **Success Color**: Emerald Green (`#10B981`) — used for earnings and COMPLETED states.
- **Warning Color**: Golden Amber (`#F59E0B`) — used for PENDING and critical alerts.
- **Typography**: Interface-first sans-serif (Inter / Roboto) with heavy weights for headlines (800-900).

---

## 2. Driver Mobile Experience (PWA)
The driver interface is **mobile-first**, optimized for low-bandwidth and high-vibration environments.

### 🏠 Home Dashboard
- **Top Banner**: Live fuel prices and local weather/context.
- **Analytics Grid**: 2x2 grid showing "Today's Earnings", "Trips", "Avg Rating", and "Wallet".
- **Real-Time Heatmap**: A Leaflet map showing "Hot Zones" (high demand) where drivers should head next.
- **Active Trip Card**: Floating shortcut to current navigation/tracking.

### 🔍 Marketplace (Find Load)
- **Home Route Priority**: Special green-bordered cards for loads heading towards the driver's hometown.
- **Detail Expand**: Cards expand on tap to show "Net Earning" calculations (Gross - Platform Fees).
- **One-Tap Accept**: Large action buttons for binary decisions (Accept/Pass).

---

## 3. Shipper Desktop Experience
The shipper portal focuses on **high-density data management** and logistics monitoring.

### 📊 Dashboard Layout
- **KPI Row**: Total shipments, Pending matches, and Active tracking dots.
- **Shipment Pipeline**: A list of recently posted loads with status badges (Searching, Matched, In-Transit).
- **Quick Post**: A minimal form at the top for recurring routes.

### 📝 Post Load Wizard
- **Geocoding**: Automatic address-to-coordinate conversion using OpenStreetMap.
- **Rate Calculator**: Real-time pricing preview as the shipper types the weight/distance.

---

## 4. Shared UX Patterns
- **Language Switcher**: Floating globally accessible button for switching between Hindi, Tamil, and English.
- **Skeleton States**: Shimmering placeholders during MockDB lookups.
- **Micro-Animations**: Framer Motion transitions (16px slide-ups) for every new menu or card entry.

## 5. Mobile Navigation Layout
The app uses a **Persistent Bottom Navigation Bar**:
1. **Home**: Dashboard & Map
2. **Find Load**: Matching Arena
3. **Bookings**: History & Active Jobs
4. **Profile**: Settings & Support

---

*LorryLink: Optimized for the road, designed for the office.*
