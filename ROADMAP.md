# Roadmap & Developer Guide — ERP Mobile (Santeh Feeds Corporation)

**Project:** Santeh Feeds Corporation - App (`/whseconfirmation`)
**Version:** 2.9.10.26
**Stack:** React Native 19.1.0 + Expo ~54 + Expo Router ~6 (TypeScript) | Express 5 + mssql 12 + Socket.io 4 (Node.js)
**Purpose:** Mobile warehouse management application for Santeh Feeds Corporation, covering raw materials, production, and supplies departments.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Backend (Server)](#backend-server)
   - [Entry Point](#entry-point)
   - [Database](#database)
   - [Authentication](#authentication)
   - [Socket.io](#socketio)
   - [API Routes](#api-routes)
4. [Frontend (Expo App)](#frontend-expo-app)
   - [Routing](#routing)
   - [Auth Flow](#auth-flow)
   - [Feature Modules](#feature-modules)
   - [Shared Infrastructure](#shared-infrastructure)
4. [Development Workflow](#development-workflow)
5. [Learning Path / Roadmap](#learning-path--roadmap)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (Expo)                        │
│  React Native 19  |  Expo Router 6  |  Expo Notifications   │
│  axios (REST API) | socket.io-client (real-time events)     │
│  Expo LinearGradient, Framer Motion, Lucide React            │
└──────────────┬──────────────┬──────────────┬─────────────────┘
               │ REST API     │ Socket.io    │ Push Notifications
               ▼              ▼              ▼
┌──────────────────────────┐  │   ┌──────────────────────────────────┐
│      Express 5 Server    │  │   │   Expo Push Notification Service  │
│  CORS, dotenv, mssql     │  │   └──────────────────────────────────┘
│  (Node.js w/ legacy TLS) │  │
└──────┬─────────────────────────────────┬───────────────────────┘
       │                                  │
       ▼  mssql 12 (Connection Pool)      │
┌─────────────────────────────────────────┴───────────┐
│  SQL Server 2005 (TLS 1.0–1.2)                       │
│  Databases: GDB, SFC, FEEDPRO, PET1                  │
│  Tables: SETTINGS.*, WHSE.*, MO.* (Schemas)          │
└──────────────────────────────────────────────────────┘
```

**Key design patterns:**
- **Backend:** Feature-sliced modules (`server/src/modules/<dept>/<feature>/`), each containing controllers, services, and routes. Database connection pooling via shared `config/database.js`. Multi-tenant company database mapping via `utils/companyDb.js`.
- **Frontend:** Feature-based directory structure (`features/<dept>/<feature>/`), each with screens, components, services, and types. Auth state managed through React Context + SecureStore. Real-time updates via Socket.io client. Push notifications via Expo Notifications + service worker.

---

## Project Structure

```
erpMobile/
├── app/                          # Expo Router entry points
│   ├── _layout.tsx               # Root layout (auth gating, notification popup)
│   ├── (tabs)/                   # Tab navigation shell
│   │   ├── _layout.tsx           # Bottom tabs with animated icons
│   │   └── index.tsx             # Default home screen
│   └── auth/                     # Auth stack (login)
│       └── login.tsx
├── features/                     # Feature-based modules (frontend)
│   ├── auth/                     # Authentication (context, service, hooks, components)
│   │   ├── components/LoginForm.tsx
│   │   ├── context/AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useLogin.ts
│   │   ├── lib/authService.ts
│   │   └── types/auth.types.ts
│   ├── shared/                   # Cross-feature shared code
│   │   └── services/
│   │       ├── notificationService.ts  # Expo push notifications
│   │       └── socketService.ts        # Socket.io client
│   ├── raw-materials-dept/       # Warehouse operations
│   │   ├── home/                 # Dashboard (warehouseMetricsService)
│   │   │   ├── WarehouseHomeScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── ModuleCard.tsx
│   │   │   │   ├── SummaryStats.tsx
│   │   │   │   └── WarehouseHeader.tsx
│   │   │   └── services/warehouseMetricsService.ts
│   │   ├── issuance-verification/
│   │   │   ├── IssuanceVerificationScreen.tsx
│   │   │   ├── components/ (AllocationTable, BarcodeScanner, etc.)
│   │   │   └── services/issuanceService.ts
│   │   ├── material-issuance-confirmation/
│   │   │   ├── MaterialIssuanceConfirmationScreen.tsx
│   │   │   └── services/ materialIssuanceConfirmationService.ts
│   │   ├── pending-warehouse-confirmation/
│   │   │   └── screens/WarehouseConfirmationScreen.tsx
│   │   ├── posted-warehouse-confirmation/
│   │   │   └── screens/WarehouseConfirmationScreen.tsx
│   │   ├── stock-balance/
│   │   │   └── screens/StockBalanceScreen.tsx
│   │   └── forklift-operator/
│   │       ├── screens/ (List, Form)
│   │       └── services/forkliftOperatorService.ts
│   ├── production-dept/
│   │   ├── material-utilization/
│   │   │   ├── pages/MaterialUtilizationScreen.tsx
│   │   │   ├── services/materialUtilizationService.ts
│   │   │   └── types/material-utilization.types.ts
│   │   ├── material-utilization-tag/
│   │   │   └── services/materialUtilizationTagService.ts
│   │   └── material-issuance/
│   │       ├── screens/ (Issuance, IssuanceForm)
│   │       └── services/materialIssuanceService.ts
│   └── supplies-dept/
│       └── issuance/
│           ├── IssuanceScreen.tsx
│           ├── components/
│           └── services/issuanceService.ts
├── server/                        # Express.js backend
│   ├── index.js                  # Server entry point
│   └── src/
│       ├── app.js                # Express app, CORS, route mounting
│       ├── socket.js             # Socket.io server
│       ├── config/
│       │   └── database.js        # mssql connection pool
│       ├── utils/
│       │   ├── companyDb.js       # Company-to-database mapping
│       │   └── socketEvents.js    # Real-time event emission
│       └── modules/              # Feature-sliced modules
│           ├── auth/
│           │   ├── controllers/authController.js
│           │   ├── controllers/companyController.js
│           │   ├── routes/authRoutes.js
│           │   └── services/authService.js
│           ├── notification/
│           │   ├── controllers/notificationController.js
│           │   ├── routes/notificationRoutes.js
│           │   └── services/notificationService.js
│           ├── schema/           # Schema/table reference routes
│           │   └── routes/schemaRoutes.js
│           ├── raw-materials-dept/
│           │   ├── warehouse/ (controller, routes)
│           │   ├── issuance/
│           │   │   ├── controllers/issuanceController.js
│           │   │   └── routes/issuanceRoutes.js
│           │   ├── forklift-operator/
│           │   │   ├── controllers/forkliftOperatorController.js
│           │   │   ├── services/forkliftOperatorService.js
│           │   │   └── routes/forkliftOperatorRoutes.js
│           │   └── material-issuance-confirmation/
│           │       ├── controllers/
│           │       └── routes/
│           ├── production-dept/
│           │   ├── material-utilization/
│           │   │   ├── controllers/materialUtilizationController.js
│           │   │   └── routes/materialUtilizationRoutes.js
│           │   ├── material-utilization-tag/
│           │   │   ├── controllers/materialUtilizationTagController.js
│         │   │   └── routes/materialUtilizationTagRoutes.js
│           │   ├── material-issuance/
│           │   │   ├── controllers/materialIssuanceController.js
│               │   └── routes/materialIssuanceRoutes.js
│               └── material-issuance-request-review/
│           │       ├── controllers/materialIssuanceRequestReviewController.js
│           │       └── routes/materialIssuanceRequestReviewRoutes.js
│           └── supplies-dept/
│               └── issuance/
│                   ├── controllers/issuanceController.js
│                   └── routes/issuanceRoutes.js
├── shared/                       # Shared UI components (frontend)
│   ├── components/
│   │   ├── ComingSoonScreen.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── ui/toast.tsx
│   │   └── ui/login/ (button.tsx, input.tsx, label.tsx)
├── components/                   # App-wide reusable components
│   ├── __mocks__/ (themed-text, themed-view)
│   ├── CancelRemarks.tsx
│   ├── ConfirmModal.tsx
│   ├── DatePickerModal.tsx
│   ├── ItemCodeModal.tsx
│   ├── SuccessModal.tsx
│   ├── TimePickerModal.tsx
│   ├── external-link.tsx
│   ├── haptic-tab.tsx
│   ├── hello-wave.tsx
│   ├── parallax-scroll-view.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ui/ (collapsible.tsx, icon-symbol.tsx, login/, modal-dialog.tsx)
├── core/services/auth/authService.ts   # Legacy auth service
├── constants/
│   ├── theme.ts              # Color palette, design tokens
│   └── ...                    # IStyles, IItemDetails, etc.
├── hooks/
│   ├── use-color-scheme.ts / .web.ts
│   ├── use-login.ts
│   ├── use-network-status.ts
│   ├── use-theme-color.ts
│   └── use-toast.ts
├── lib/
│   ├── auth.service.ts       # Auth API helper
│   ├── db.ts                 # mssql pool (frontend, not for production)
│   └── utils.ts              # Utility functions
├── types/                    # Global TypeScript types
├── .env                      # Environment configuration (not committed)
├── app.json                  # Expo config
├── eas.json                  # EAS build profiles
├── tsconfig.json             # TypeScript strict mode
├── babel.config.js           # babel-preset-expo + react-native-reanimated
├── metro.config.json         # Metro bundler config
├── eslint.config.js          # ESLint flat config
└── package.json              # Dependencies & scripts
```

---

## Backend (Server)

### Entry Point

**File:** `server/index.js`

```bash
# Development
node server/index.js

# Production (required for SQL Server 2005 TLS compatibility)
node --openssl-legacy-provider server/index.js
```

**Key details:**
- Uses `--openssl-legacy-provider` flag for compatibility with SQL Server 2005's TLS 1.0–1.2.
- Loads environment variables via `dotenv` from `.env`.
- Imports `app.js` and attaches Socket.io server to the HTTP server.
- Listens on `PORT` (from `.env`).

### Database

**File:** `server/src/config/database.js`

- Uses `mssql` package (v12) to create connection pools.
- `getPool(databaseName)` — async function returning a cached `mssql.ConnectionPool` per database.
- Connection settings pulled from `.env`:
  - `DB_HOST` — SQL Server host
  - `DB_USER` — Database user
  - `DB_PASSWORD` — Database password
  - `DB_GDB`, `DB_SFC`, `DB_FEEDPRO`, `DB_PET1` — Database names (multi-tenant)
- Pooling options: `max: 10`, `idleTimeout: 30000`, `pool: { max: 10, min: 0, idleTimeout: 30000 }`.

**File:** `server/src/utils/companyDb.js`

- Maps company codes to their respective database names.
- `getCompanyDb(companyCode)` returns the appropriate `DB_*` environment variable.
- Used across all service modules to route queries to the correct database.

### Authentication

**Module:** `server/src/modules/auth/`

| File | Description |
|------|-------------|
| `controllers/authController.js` | Handles `/login`, `/health` endpoints; validates user credentials against SQL query |
| `controllers/companyController.js` | Company selection/validation endpoints |
| `routes/authRoutes.js` | Auth sub-routes (`/validate`, `/company`) |
| `services/authService.js` | Business logic for authentication queries |

**Login flow:**
1. User submits username + password (scanned via barcode on mobile).
2. Server queries SQL Server: `SELECT * FROM [WHSE.SCANNERLOGIN] WHERE SCANNED_APPROVER = @scannedApprover`
3. Returns company list, user role, and access permissions.
4. Token-based session (no JWT — uses cookie/session for auth state).

### Socket.io

**File:** `server/src/socket.js`

- Attaches Socket.io to the HTTP server.
- CORS configured for WebSocket connections.
- Listens for `connection` events; logs connected socket IDs.

**File:** `server/src/utils/socketEvents.js`

- `emitNotification(io, event, data)` — broadcasts real-time notifications to connected clients.
- `emitMaterialIssuanceUpdate(io, data)` — emits material issuance status changes.
- `emitWarehouseConfirmationUpdate(io, data)` — emits warehouse confirmation updates.

### API Routes

All routes are mounted in `server/src/app.js`:

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| `GET` | `/health` | AuthController | Health check |
| `POST` | `/login` | AuthController | Login (scanned approver) |
| `GET` | `/auth/:endpoint` | authRoutes | Auth sub-routes |
| `GET` | `/schema/:endpoint` | schemaRoutes | Schema/table references |
| `GET` | `/warehouse/metrics` | warehouseController | Warehouse dashboard metrics |
| `GET` | `/warehouse/transactions` | warehouseController | Warehouse transactions |
| `GET` | `/stock-balance` | warehouseController | Stock balance query |
| `GET / POST / PUT / DELETE / PATCH` | `/forklift-operators/*` | ForkliftOperatorController | CRUD for forklift operators (`SETTINGS.FORKLIFTOPERATOR`) |
| `GET` | `/issuance/*` | IssuanceController | Raw materials issuance |
| `GET` | `/supplies/issuance/*` | IssuanceController | Supplies department issuance |
| `GET / POST / PUT / DELETE` | `/production-dept/material-issuance/*` | MaterialIssuanceController | Material issuance |
| `GET` | `/production-dept/material-issuance-request-review/*` | MaterialIssuanceRequestReviewController | Approve/reject requests (bulk) |
| `GET / PUT` | `/production-dept/material-utilization/*` | MaterialUtilizationController | Material utilization |
| `GET / PUT` | `/production-dept/material-utilization-tag/*` | MaterialUtilizationTagController | Update utilization tags |
| `GET / PUT` | `/raw-materials-dept/material-issuance-confirmation/*` | MaterialIssuanceConfirmationController | Confirmation |
| `GET / POST / PUT / DELETE / PATCH` | `/notification/*` | NotificationController | Notification CRUD (Expo push) |

---

## Frontend (Expo App)

### Routing

Uses **Expo Router 6** with file-based routing:

```
app/
├── _layout.tsx                 # Root: SessionProvider, NotificationPopup, ThemeProvider
├── (tabs)/
│   ├── _layout.tsx            # Bottom tabs (Animated, Framer Motion icons)
│   └── index.tsx              # Default: Redirects to dept home
├── auth/
│   └── login.tsx              # LoginForm component
└── ... (deep linking for features)
```

The root `_layout.tsx` wraps the app in:
- `SessionProvider` (auth context)
- `NotificationPopup` (real-time notification overlay)
- `useNotificationPermissions` (expo-notifications permission handler)

### Auth Flow

```
app/auth/login.tsx
  └─ features/auth/components/LoginForm.tsx
      └─ features/auth/hooks/useLogin.ts
          └─ features/auth/lib/authService.ts
              └─ POST /login  (axios)
                  └─ core/services/auth/authService.ts
                      └─ (stores credentials in SecureStore)
```

**Key files:**
- `features/auth/context/AuthContext.tsx` — React Context providing `session` state and `setSession` setter.
- `features/auth/lib/authService.ts` — `login()` calls `/login`, processes response, stores user data in `expo-secure-store`.
- `features/auth/types/auth.types.ts` — `User`, `LoginResponse`, `UserAccess` interfaces.
- `hooks/use-login.ts` — Custom hook wrapping `AuthContext` + `authService`.

### Feature Modules

#### Raw Materials Department

| Feature | Screen | Service | API Endpoints |
|---------|--------|---------|---------------|
| Home (Dashboard) | `WarehouseHomeScreen` | `warehouseMetricsService` | `GET /warehouse/metrics`, `/pending-transactions`, `/completed-today`, `/posted-transactions` |
| Warehouse Confirmation | `WarehouseConfirmationScreen` | (embedded) | `GET /warehouse/*`, `PUT /raw-materials-dept/material-issuance-confirmation/*` |
| Issuance Verification | `IssuanceVerificationScreen` | `issuanceService` | `GET /issuance/*` |
| Stock Balance | `StockBalanceScreen` | `stockBalanceService` | `GET /stock-balance` |
| Forklift Operators | `ForkliftOperatorListScreen`, `ForkliftOperatorFormScreen` | `forkliftOperatorService` | `GET /forklift-operators`, `POST`, `PUT`, `DELETE`, `PATCH /:id/toggle-status` |

#### Production Department

| Feature | Screen | Service | API Endpoints |
|---------|--------|---------|---------------|
| Material Utilization | `MaterialUtilizationScreen` | `materialUtilizationService` | `GET /production-dept/material-utilization/get-material-utilization`, `PUT /update-material-utilization` |
| Utilization Tag | (modals/pickers) | `materialUtilizationTagService` | `GET /production-dept/material-utilization-tag/get-tag`, `PUT /update-tag` |
| Material Issuance | `IssuanceScreen`, `IssuanceForm` | `materialIssuanceService` | `GET /production-dept/material-issuance/*` |

#### Supplies Department

| Feature | Screen | Service | API Endpoints |
|---------|--------|---------|---------------|
| Issuance | `IssuanceScreen` | `issuanceService` | `GET /supplies/issuance/*` |

### Shared Infrastructure

#### Socket.io Client
**File:** `features/shared/services/socketService.ts`

- Singleton class wrapping `socket.io-client`.
- Connects to `${apiUrl}` via WebSocket.
- Emits `register` event with user/company for scoped notifications.
- Methods: `onMaterialIssuanceUpdate()`, `onWarehouseConfirmationUpdate()`, `onNotification()`.
- Auto-reconnect with exponential backoff.

#### Notification Service
**File:** `features/shared/services/notificationService.ts`

- Uses `expo-notifications` for push notifications.
- `NotificationService` class manages:
  - Permission requests (`requestPermissions()`)
  - Push token registration (`registerForPushNotificationsAsync()`)
  - Local notification scheduling (`scheduleNotification()`)
  - Expo push API messaging (via server `/notification` endpoints)

#### Theme
**File:** `constants/theme.ts`

```typescript
export const theme = {
  colors: {
    primary: '#1e40af',      // Blue-900
    secondary: '#fb9244',    // Orange-400
    background: '#ffffff',
    surface: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',         // Slate-900
    textSecondary: '#64748b', // Slate-500
    border: '#e2e8f0',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
    // ... plus department-specific colors
  },
  spacing, typography, borderRadius, ...
};
```

#### Shared UI Components
- `shared/components/ui/toast.tsx` — Toast notification component
- `shared/components/LoadingScreen.tsx` — Full-screen loading spinner
- `shared/components/ComingSoonScreen.tsx` — Placeholder screen

---

## Development Workflow

### Prerequisites
- Node.js 18+ or 20+
- SQL Server 2005 or later (with legacy TLS support)
- `.env` file with `DB_*`, `PORT`, `EXPO_PUBLIC_API_URL`

### Scripts (`package.json`)

```bash
# Frontend
npx expo start              # Start Expo dev server
npx expo run:android        # Build Android
npx expo run:ios            # Build iOS
eas build --platform android  # EAS build (Android)
eas build --platform ios      # EAS build (iOS)
npx tsc --noEmit            # TypeScript type check
npx eslint .                # Lint

# Backend
node server/index.js        # Start server (dev)
node --openssl-legacy-provider server/index.js  # Start (prod with TLS)
```

### Configuration Files

| File | Purpose |
|------|---------|
| `app.json` | Expo config: name, slug, version `2.9.10.26`, plugins (expo-router, splash-screen, camera, font, notifications), EAS project ID |
| `eas.json` | Build profiles (development, preview, production) |
| `tsconfig.json` | TypeScript strict mode, path aliases |
| `babel.config.js` | `babel-preset-expo` + `react-native-reanimated/plugin` |
| `metro.config.json` | Metro bundler config |
| `eslint.config.js` | ESLint flat config (no semicolons, single quotes) |

### Environment Variables (`.env`)

```
# SQL Server
DB_HOST=192.168.10.85
DB_USER=santeh
DB_PASSWORD=***********
DB_GDB=GDB_Santeh
DB_SFC=SFC_Santeh
DB_FEEDPRO=FEEDPRO_Santeh
DB_PET1=PET1_Santeh

# Server
PORT=3000

# Expo (client-side)
EXPO_PUBLIC_API_URL=http://192.168.10.85:3000
```

**In app.json:** `"extra": { "apiUrl": "http://192.168.10.85:3000" }` — accessed via `Constants.expoConfig?.extra?.apiUrl`.

---

## Learning Path / Roadmap

### Phase 0 — Environment Setup (1–2 days)
**Goal:** Get the app running locally.
1. Clone repo, install Node.js 20+, copy `.env.example` to `.env`.
2. Set up SQL Server connection (test with `/test-db` endpoint).
3. Run backend: `node --openssl-legacy-provider server/index.js`.
4. Run frontend: `npx expo start`.
5. Scan QR code on a physical device (requires same network).

### Phase 1 — Codebase Orientation (2–3 days)
**Goal:** Understand the app architecture and data flow.
1. **Auth system:** Read `LoginForm.tsx` → `authService.ts` → `/login` endpoint → `authController.js`. Understand how user roles/companies are returned.
2. **Database layer:** Read `database.js` (connection pooling) → `companyDb.js` (multi-tenant routing) → a service module like `forkliftOperatorService.ts` to see query patterns.
3. **API layer:** Read `app.js` to see all mounted routes and their patterns.
4. **Frontend navigation:** Read `_layout.tsx` (tabs) → `WarehouseHomeScreen.tsx` (dashboard) → a feature screen like `IssuanceVerificationScreen.tsx`.
5. **Shared infrastructure:** Read `socketService.ts` and `notificationService.ts` to understand real-time + push notification flows.

### Phase 2 — Feature Deep Dive (3–5 days)
**Goal:** Understand how each module works end-to-end.
1. **Raw Materials — Warehouse Dashboard:**
   - `WarehouseHomeScreen` → `warehouseMetricsService.getMetrics()` → `GET /warehouse/metrics` → `warehouseController.getMetrics()`.
   - Build a new metric widget: modify the backend query, add a frontend component.
2. **Raw Materials — Forklift Operators:**
   - Full CRUD: `ForkliftOperatorListScreen` ↔ `forkliftOperatorService` ↔ `/forklift-operators/*` ↔ `SETTINGS.FORKLIFTOPERATOR` table.
   - Add a new column: update SQL queries, types, screen, service.
3. **Raw Materials — Issuance Verification:**
   - Barcode scanning flow: `BarcodeScanner` component → `issuanceService` → `/issuance/*` endpoints.
   - Understand allocation table rendering.
4. **Production — Material Utilization:**
   - `MaterialUtilizationScreen` → `materialUtilizationService` → `/production-dept/material-utilization/*`.
   - Understand tag-based quantity adjustment flow.
5. **Production — Material Issuance Request Review:**
   - `GET /production-dept/material-issuance-request-review/*` → approve/reject with bulk operations.
   - Trace how Socket.io events notify the warehouse after approval.
6. **Supplies — Issuance:**
   - `IssuanceScreen` → `issuanceService` → `/supplies/issuance/*`.

### Phase 3 — Real-time & Notifications (2 days)
**Goal:** Master the real-time aspects.
1. **Socket.io:** Read `socket.js` (server) → `socketEvents.js` (event emitters) → `socketService.ts` (client).
2. **Notifications:** Read `notificationService.ts` (client) → `notificationRoutes.js` → `notificationController.js` → `notificationService.js` (server).
3. **Integration:** Understand how `MaterialIssuanceRequestReviewController.approveRequest()` triggers `emitMaterialIssuanceUpdate(io, data)` and how the client `WarehouseConfirmationScreen` listens via `socketService.onWarehouseConfirmationUpdate()`.

### Phase 4 — Build & Deploy (1–2 days)
**Goal:** Deploy updates through EAS.
1. **EAS build:** `eas build --platform android --profile production`.
2. **Updates:** Understand `expo-router` deep linking and OTA update considerations.
3. **Production server:** `node --openssl-legacy-provider server/index.js` behind a reverse proxy.

### Phase 5 — Contribution Guidelines (Ongoing)
**Branch naming:** `feature/<dept>/<feature-name>` or `fix/<bug-description>`
**Commit format:** `feat: <description>`, `fix: <description>`, `chore: <description>`
**PR review:** Ensure TypeScript types are defined for new API responses, service methods return consistent `{ success, data, error? }` shapes, and Socket.io events are documented in `socketEvents.js`.

---

*This roadmap was generated from source code inspection of the actual `erpMobile` project at `C:\PROJECTS\erpMobile` on 2026-09-17.*