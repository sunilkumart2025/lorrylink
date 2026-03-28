# 🚛 LorryLink: Revolutionizing Indian Logistics

LorryLink is a mobile-first logistics ecosystem designed to optimize the "Return Load" problem for Indian truck drivers while providing shippers with radical transparency and AI-driven matching.

## 🌟 Project Vision
To eliminate "dead mileage" (empty return trips) by connecting empty trucks with nearby cargo using a high-trust, mobile-optimized, and financially transparent interface.

---

## 🏗️ The Four Pillars of LorryLink

### 1. Frictionless Matching
- **AI-Scoring**: Loads are ranked based on proximity, route alignment, and payout.
- **Instant Acceptance**: Drivers can express interest with a single tap.
- **PWA Ready**: Built as a Progressive Web App for low-bandwidth road environments.

### 2. Radical Simplicity & Accessibility
- **High Contrast UI**: Optimized for one-handed operation in bright sunlight.
- **Glassmorphism**: Premium dark-mode aesthetic to reduce eye strain.
- **Multi-lingual**: Full support for Hindi, Tamil, and English.

### 3. Financial Transparency
- **Earnings Calculator**: Shows drivers the *net profit* after platform fees and estimated fuel costs.
- **Fixed Rate Cards**: No hidden margins or complex bidding wars.
- **Digital Proof**: Integrated ePOD (Proof of Delivery) triggers instant payment flows.

### 4. Route Optimization
- **Home Route Priority**: A proprietary feature that highlights loads dropping near a driver's hometown.
- **Freight Heatmaps**: Live "Hot Zones" show where the highest demand for trucks exists.

---

## 💻 Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 + Vite |
| **Styling** | Vanilla CSS + Framer Motion (Animations) |
| **State Management** | Zustand (Persistent local store) |
| **Data Engine** | **MockDB** (Custom JSON-backed memory storage) |
| **Mapping & GIS** | Leaflet + OpenStreetMap + Nominatim API |
| **Routing** | OSRM (Open Source Routing Machine) |

---

## 🛠️ Key Features

### For Drivers
- **Home Dashboard**: Live freight density map and performance stats (Trips, Earnings, Rating).
- **Matching Arena**: Smart list of loads with "Home Route" ribbons.
- **Live Navigation**: Specialized truck routing that avoids restricted city zones.
- **Detour Calculator**: Analyzes if a 10km detour is worth the extra payload.

### For Shippers
- **Control Center**: KPI-driven dashboard with real-time fleet tracking.
- **Post Load Wizard**: Automated geocoding and instant AI-match preview.
- **Transparent Billing**: Direct cost-per-ton tracking and digital audit trails.

---

## 📊 Project Status: "Self-Contained Demo"
The project has recently transitioned from a live Supabase backend to a **Pure Local MockDB**. This allows the platform to run:
- **Offline/Zero-Conf**: No database setup required.
- **Consistent Demos**: Pre-populated with professional sample loads and driver history.
- **Interactive**: The session state tracks your "Posts" and "Accepts" locally in browser memory.

---

*LorryLink: Bringing efficiency to every kilometer.*
