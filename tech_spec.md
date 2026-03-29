# LorryLink Technical Specification & Design System

This document provides the backend schema, API details, and design tokens required for the LorryLink Frontend development.

---

## 🏗️ 1. Backend Architecture (Supabase)

LorryLink uses **Supabase** (Postgres + PostGIS) for data, auth, and real-time synchronization.

### 📊 Database Schema

| Table | Purpose | Key Columns |
| :--- | :--- | :--- |
| **`profiles`** | User data | `id`, `rolea` (driver/business), `name`, `phone`, `home_city` |
| **`shipments`** | Load requests | `id`, `pickup_address`, `drop_address`, `pickup_location` (geography), `drop_location` (geography), `weight_kg`, `price`, `status` (`pending`, `in_transit`, `completed`) |
| **`bookings`** | Accepted loads | `id`, `shipment_id`, `driver_id`, `agreed_price`, `status`, `current_milestone` |
| **`tracking`** | Live GPS pings | `id`, `booking_id`, `location` (geography), `speed`, `recorded_at` |
| **`trucks`** | Vehicle info | `id`, `driver_id`, `vehicle_number`, `vehicle_type`, `capacity_kg` |
| **`messages`** | Chat | `id`, `booking_id`, `sender_id`, `content`, `created_at` |

### ⚡ Optimized Latency Query (RPC)
The frontend should use the custom RPC `get_shipments_with_tracking` to retrieve active loads. This uses a **LATERAL JOIN** to fetch only the single latest GPS point per truck, reducing data transfer by 90%.

---

## 🎨 2. Design System (Color Palette)

LorryLink uses a **Premium Dark Mode (Highway Edition)** aesthetic.

### Core Colors (CSS Tokens)
| Token | Hex/Value | Usage |
| :--- | :--- | :--- |
| `--color-background` | `#0A0A0F` | Main deep black background |
| `--color-surface` | `#111827` | Card backgrounds |
| `--color-primary` | `#3B82F6` | Primary action buttons / Call to Action |
| `--color-accent` | `#22D3EE` | Highlights / Icons |
| `--color-success` | `#22C55E` | "Delivered" / "Verified" states |
| `--color-warning` | `#F59E0B` | "Pending" / "Delayed" alerts |
| `--color-error` | `#EF4444` | Cancellations / GPS Errors |

### Glassmorphism System
- **Background**: `rgba(17, 24, 39, 0.65)`
- **Border**: `rgba(255, 255, 255, 0.08)`
- **Blur**: `20px` (standard)
- **Border Radius**: `24px` (cards) | `14px` (buttons)

---

## 🗺️ 3. Map & Navigation Logic

### Routing (OSRM)
- **Base URL**: `https://router.project-osrm.org/`
- **Logic**: Use OSRM for full geometry fetching to draw the blue polyline route.

### Geocoding (Nominatim)
- **Fuzzy Search**: Handles driver typos (e.g. "Benguluru" -> "Bengaluru").
- **API**: `https://nominatim.openstreetmap.org/search?format=json&q={query}`

---

## 🛠️ 4. What is Needed (Frontend)

To build a new page or component, follow these rules:

1.  **Internationalization (i18n)**: 
    - Never hardcode strings. Always use `t('key.name')` from `react-i18next`.
    - Supported: English (`en`), Hindi (`hi`), Tamil (`ta`).
2.  **State Sync**:
    - Use `useStore` (Zustand) for global driver data (`user`, `activePost`).
    - Use `useRealtimeSync` hook for auto-updating tables.
3.  **Components**:
    - Use the `.card-glass` class for all containers.
    - Use `framer-motion` for transitions (Scale `0.98` on click).
4.  **Icons**: Use `lucide-react` for all iconography.
