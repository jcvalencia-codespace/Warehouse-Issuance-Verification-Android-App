# Installation Guide — ERP Mobile (Santeh Feeds Corporation)

This guide walks you through installing, configuring, and running the **ERP Mobile**
application — a full-stack React Native / Expo + Express.js system backed by
Microsoft SQL Server.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Install Frontend Dependencies](#3-install-frontend-dependencies)
4. [Configure Environment Variables (`.env`)](#4-configure-environment-variables-env)
5. [Configure Expo App (`app.json`)](#5-configure-expo-app-appjson)
6. [Install & Start the Backend Server](#6-install--start-the-backend-server)
7. [Start the Frontend (Expo Dev Server)](#7-start-the-frontend-expo-dev-server)
8. [Running the Full Stack (Dev)](#8-running-the-full-stack-dev)
9. [Building for Production (EAS)](#9-building-for-production-eas)
10. [Database Setup](#10-database-setup)
11. [Verifying the Installation](#11-verifying-the-installation)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

| Requirement | Minimum Version | Why It's Needed |
|---|---|---|
| **Node.js** | 18.x LTS | Runs both the backend server and the Expo tooling |
| **npm** | 9.x | Package manager (comes with Node.js) |
| **Expo CLI** | 6.x | Running the mobile dev server (`npx expo start`) |
| **SQL Server** | SQL Server 2005+ | The backend connects to your company's MSSQL instance |
| **.NET Desktop Runtime** *(Windows only, for tooling)* | 6.0+ | Required by some SQL Server tooling |
| **Android Studio** *(optional, for Android dev)* | Arctic Fox+ | Android emulator + SDK |
| **Xcode** *(optional, macOS only, for iOS dev)* | 14+ | iOS simulator |
| **Git** | 2.30+ | Cloning the repository |

> **Note:** The backend server requires the `--openssl-legacy-provider` flag
> (the `npm run server` script already includes this) for SQL Server 2005
> TLS compatibility. No additional setup is needed — just use the provided scripts.

---

## 2. Clone the Repository

```bash
git clone <your-repository-url> erpMobile
cd erpMobile
```

---

## 3. Install Frontend Dependencies

From the **project root** (where `package.json` lives):

```bash
npm install
```

This installs all dependencies including:
- React Native & Expo SDK
- axios, socket.io-client
- lucide-react-native, @expo/vector-icons
- react-native-reanimated, framer-motion
- expo-camera, expo-notifications

The server dependencies (`server/`) are **Node.js built-ins + `mssql`, `express`,
`socket.io`, `cors`, `dotenv`** — these are managed separately but are also
installed at the root level (they are listed in the root `package.json` and
resolved when running `npm run server`).

---

## 4. Configure Environment Variables (`.env`)

Create a `.env` file in the **project root** (same directory as `package.json`).
A template is shown below — use the existing `.env` as a reference.

```env
# ─── Database Connection ─────────────────────────────────────
DB_HOST=127.0.0.1
# DB_HOST=SANSER03\SANTEHSQL2K5   # ← uncomment/use your SQL Server instance

DB_USER=sa
DB_PASSWORD=your_sql_password_here

# ─── Multi-Tenant Databases ──────────────────────────────────
# GDB = shared/system database (login, notifications, schema)
DB_GDB=GDB
# Company-specific databases (one per company)
DB_SFC=SFC
DB_FEEDPRO=FEEDPRO
DB_PET1=PET1

# ─── Server ───────────────────────────────────────────────────
PORT=3000

# ─── API URL for Mobile App ───────────────────────────────────
# IMPORTANT: Set this to your server's reachable IP address
# - On local network: http://<your-local-ip>:3000
# - On same machine:   http://localhost:3000
# - Production:        http://<server-ip>:3000
EXPO_PUBLIC_API_URL=http://192.168.10.85:3000
```

> **Important:** The `EXPO_PUBLIC_API_URL` must be reachable from the mobile
> device/emulator. `localhost` works for web and emulators but **not** for
> physical devices. Use your machine's LAN IP for physical device testing.

---

## 5. Configure Expo App (`app.json`)

The Expo config in `app.json` exposes the API URL to the app via `expo.extra.apiUrl`:

```json
"extra": {
  "apiUrl": "http://192.168.10.85:3000"
}
```

Update this to match the `EXPO_PUBLIC_API_URL` from your `.env`. The frontend
services read this at runtime via:

```typescript
this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
```

---

## 6. Install & Start the Backend Server

The backend is an Express.js application located in `server/`. The start script
already includes the `--openssl-legacy-provider` flag:

```bash
# Development (starts the API server only)
npm run server
```

You should see output like:

```
🚀 Server running on http://0.0.0.0:3000
📍 Test with: http://192.168.10.85:3000/health
🔌 Socket.io initialized
✅ Database connection established
```

**What happens on startup:**
1. `server/index.js` starts the Express app and HTTP server
2. Socket.io is initialized on the same port
3. The default database pool (`DB_GDB`) is warmed up
4. All module routes are mounted (see `server/src/app.js`)

The server listens on `0.0.0.0:<PORT>` so it's accessible from other devices
on the LAN.

---

## 7. Start the Frontend (Expo Dev Server)

In a **separate terminal**, from the project root:

```bash
npm start
```

This opens the Expo dev tools (Metro bundler). You can then:
- Press `a` — run on a connected Android device/emulator
- Press `i` — run on iOS simulator (macOS only)
- Press `w` — run in a web browser
- Scan the QR code with the **Expo Go** app (if using a non-dev build)

---

## 8. Running the Full Stack (Dev)

To run both the backend server and the Expo dev server concurrently:

```bash
npm run dev
```

This uses `concurrently` to start both:
```
"dev": "concurrently \"npm run server\" \"npm run start\""
```

You'll see both the server logs and the Expo QR code / dev menu.

---

## 9. Building for Production (EAS)

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) for
production builds. Ensure you have an Expo account and are logged in:

```bash
npx eas login
```

### Android

```bash
npx eas build --platform android
```

### iOS

```bash
npx eas build --platform ios
```

### Web

```bash
npm run web
```

> The EAS project ID is configured in `app.json` under
> `expo.extra.eas.projectId`: `87117d36-2b1e-499c-9965-f77f6854627b`

### Build Configuration

Build profiles and credentials are managed in `eas.json`. The Android config
enables:
- Edge-to-edge display
- Camera, microphone, and notification permissions
- Cleartext traffic (for non-HTTPS local server communication)

iOS config:
- Status bar hidden
- Tablet support enabled

---

## 10. Database Setup

### Required Databases

The backend connects to multiple SQL Server databases:

| Database | Purpose | Environment Variable |
|---|---|---|
| `GDB` | Shared/system — `SYSTEM.USERACCOUNT`, `SYSTEM.NOTIFICATIONMASTER`, `SYSTEM.USER_LOGIN_HISTORY`, schema introspection | `DB_GDB` |
| `SFC` | SFC company data — warehouse transactions | `DB_SFC` |
| `FEEDPRO` | FeedPro company data | `DB_FEEDPRO` |
| `PET1` | PET1 company data | `DB_PET1` |

### Required SQL Server Tables (Sample)

The application reads from and writes to these key tables:

| Table | Department | Purpose |
|---|---|---|
| `SYSTEM.USERACCOUNT` | Auth | User login credentials |
| `SYSTEM.USER_LOGIN_HISTORY` | Auth | Login audit trail |
| `SYSTEM.NOTIFICATIONMASTER` | Notification | Active notifications |
| `SYSTEM.NOTIFICATIONMASTERHISTORY` | Notification | Acknowledged notifications |
| `INVENTORY.QUANTITYMASTER2` | Supplies / RM | Stock with FIFO lot tracking |
| `INVENTORY.QUANTORYMASTER3.HEADER` / `.DETAILS` | Supplies / Production | QM3 stock header/details |
| `INVENTORY.QUANTITYMASTER4.HEADER` / `.DETAILS` | RM (Warehouse) | QM4 stock header/details |
| `INVENTORY.ISSUANCEHEADER3` / `ISSUANCEDETAILS3` | Supplies | Issuance records |
| `INVENTORY.WHSEAREA` | RM | Warehouse area allocation |
| `PRODUCTION.USAGEHEADER` / `USAGEDETAILS` / `USAGEBASEDETAILS` | Production | Material utilization records |
| `PRODUCTION.USAGETAG` | Production | Inventory tagging flag |
| `PRODUCTION.MATERIALISSUANCEREQUEST.HEADER` / `.DETAILS` | Production | MIR requests |
| `SETTINGS.ISSUANCETYPE` | Supplies | Transaction/issuance types |
| `SETTINGS.PROJECTNAME` | Supplies | Project/area routing |
| `SETTINGS.MACHINE` | Supplies | Machine numbers |
| `SETTINGS.SYSTEM` | — | Company settings |
| `IV00101` | All | Item master (item code → description) |
| `SALES.VARIANTITEM` | Production | Feed types & variants |

### Database Permissions

The SQL user (`DB_USER`) needs:
- **Read** access on all tables listed above
- **Write/Insert/Update** on transactional tables (`ISSUANCEHEADER3`,
  `USAGEHEADER`, `USAGEDETAILS`, `QUANTITYMASTER2`, `NOTIFICATIONMASTER`, etc.)
- **Execute** on stored procedures (e.g.,
  `[2026.spProducationMaterialUtilizationSave]`)

---

## 11. Verifying the Installation

### 11.1 Health Check

Once the server is running, verify it's reachable:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{ "status": "ok", "timestamp": "2026-09-08T00:00:00.000Z" }
```

### 11.2 Database Connection Test

```bash
curl http://localhost:3000/test-db
```

Expected response (on success):
```json
{
  "success": true,
  "message": "Database connection successful",
  "database": "GDB",
  "result": [{ "test": 1 }]
}
```

### 11.3 Schema Introspection Test

```bash
curl http://localhost:3000/schema
```

Returns a list of all base tables in the `GDB` database.

### 11.4 Root Endpoint

```bash
curl http://localhost:3000/
```

Returns available endpoints:
```json
{
  "status": "Server is running",
  "endpoints": {
    "health": "GET /health",
    "login": "POST /login or POST /auth/login",
    "schema": "GET /schema or GET /schema/:tableName",
    "testDb": "GET /test-db"
  }
}
```

### 11.5 Frontend (Web)

```bash
npm run web
```

Open `http://localhost:8081` in a browser. You should see the app's splash
screen, followed by the login screen. Enter valid credentials from
`SYSTEM.USERACCOUNT`.

---

## 12. Troubleshooting

### ❌ "Cannot reach server" / `ECONNREFUSED`

- Verify the backend server is running (`npm run server`)
- Check `EXPO_PUBLIC_API_URL` in `.env` matches `expo.extra.apiUrl` in `app.json`
- Ensure the IP/port is reachable from your device/emulator
  (test with `curl` from the device)

### ❌ `ENOTFOUND` / DNS errors

- Use a reachable IP address (not `localhost`) for `EXPO_PUBLIC_API_URL` if
  testing on a physical device

### ❌ `ETIMEDOUT` / `ECONNABORTED`

- Check network connectivity between the device/emulator and the server
- Verify the server's firewall allows inbound connections on `PORT` (default 3000)
- Increase the server timeout if needed

### ❌ "Database is not properly configured. Missing values."

- Ensure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and at least `DB_GDB` are set in `.env`
- The server loads `.env` from project root (`server/src/app.js` line 20)

### ❌ TLS/SSL errors on startup (`ERR_TLS_VERSION_OR_CIPHER_MISMATCH`)

- The start script handles this: **`npm run server`** uses
  `node --openssl-legacy-provider server/index.js`
- Do **not** run `node server/index.js` directly without the flag

### ❌ "API URL not configured!"

- The frontend reads the API URL from Expo config:
  `Constants.expoConfig?.extra?.apiUrl`
- Ensure `app.json` → `expo.extra.apiUrl` is set correctly
- You may need to restart the Expo dev server after changing `app.json`

### ❌ Login fails with "Invalid username or password"

- Verify the user exists in `SYSTEM.USERACCOUNT` (table in `GDB` database)
- Check `DB_USER` / `DB_PASSWORD` credentials have read access to `GDB`

### ❌ "Item has insufficient stock" (on issuance submission)

- The backend performs FIFO allocation against
  `INVENTORY.QUANTITYMASTER2`
- Verify the item has positive available balance
  (`QUANTITY + QUANTITYADJ - QUANTITYISSUANCE > 0`)

### ❌ Socket.io connection issues

- The frontend `SocketService` (`features/shared/services/socketService.ts`)
  connects to the same `baseUrl`
- Check the server console for `Client connected:` logs
- CORS is permissive on the server (`origin: '*'`); check device network if
  connections are still rejected

### ❌ App shows only a loading screen

- The root layout simulates a 1.1s startup delay. If it hangs, open the dev
  menu and check the console for JavaScript errors
- Ensure `AuthProvider` is properly initialized (see `app/_layout.tsx`)

---

## Quick Start Summary

```bash
# 1. Clone
git clone <repo-url> erpMobile && cd erpMobile

# 2. Install dependencies
npm install

# 3. Create .env (copy template above, set your DB creds + IP)

# 4. Start backend + frontend together
cd server
node index.js
```

Then open `http://localhost:8081` (web) or scan the Expo QR code on your device.
