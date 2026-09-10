# ERP Mobile — Project Documentation

**Project Name:** Santeh Feeds Corporation — ERP Mobile App
**Slug:** `ERP-Mobile`
**Version:** 2.9.10.26 (per `app.json`)
**Client:** `whseconfirmation` (per `package.json`)
**Last Updated:** September 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Where's the MVC?](#5-wheres-the-mvc)
   - 5.1 [Backend (Server) MVC Mapping](#51-backend-server-mvc-mapping)
   - 5.2 [Frontend (Mobile App) MVC Mapping](#52-frontend-mobile-app-mvc-mapping)
   - 5.3 [End-to-End Request Flow](#53-end-to-end-request-flow)
6. [Department / Module Catalog](#6-department--module-catalog)
   - 6.1 [Backend Modules](#61-backend-modules)
   - 6.2 [Frontend Features](#62-frontend-features)
7. [Backend Deep Dive](#7-backend-deep-dive)
   - 7.1 [Application Entry Point](#71-application-entry-point)
   - 7.2 [Database Connection](#72-database-connection)
   - 7.3 [Multi-Tenant Company Mapping](#73-multi-tenant-company-mapping)
   - 7.4 [Real-Time (Socket.io)](#74-real-time-socketio)
   - 7.5 [Configuration (`.env`)](#75-configuration-env)
8. [Frontend Deep Dive](#8-frontend-deep-dive)
   - 8.1 [Routing (Expo Router)](#81-routing-expo-router)
   - 8.2 [Authentication Flow](#82-authentication-flow)
   - 8.3 [API Service Layer](#83-api-service-layer)
   - 8.4 [Data Types (Models)](#84-data-types-models)
   - 8.5 [Shared Components & Hooks](#85-shared-components--hooks)
9. [Feature Walkthroughs](#9-feature-walkthroughs)
   - 9.1 [Supplies Dept — Issuance](#91-supplies-dept--issuance)
   - 9.2 [Production Dept — Material Utilization](#92-production-dept--material-utilization)
   - 9.3 [Raw Materials Dept — Warehouse & Issuance Confirmation](#93-raw-materials-dept--warehouse--issuance-confirmation)
   - 9.4 [Notifications](#94-notifications)
10. [Key Design Patterns](#10-key-design-patterns)
11. [Running the Project](#11-running-the-project)
12. [API Reference (Summary)](#12-api-reference-summary)

---

## 1. Project Overview

**ERP Mobile** is a React Native / Expo mobile application paired with an Express.js
backend. It is used by **Santeh Feeds Corporation** to perform warehouse, supplies,
and production-department transactions on mobile devices. The app connects to a
Microsoft SQL Server (MSSQL) database backend that already contains the company's
ERP data.

The mobile app is a **thin client**: it performs no direct database access. Instead
it makes HTTP requests (and real-time Socket.io events) to the Express.js server,
which in turn queries the SQL Server via stored procedures and parameterized SQL.

### Core Domain Areas

| Department | Responsibility |
|---|---|
| **Raw Materials Dept** | Warehouse stock balance, material issuance confirmation, forklift operator management, issuance verification, pending/posted transaction views, reports |
| **Supplies Dept** | Supplies issuance (internal), posted issuance records |
| **Production Dept** | Material utilization (batch/dosing), material issuance requests, material utilization tags, posting review |

---

## 2. Architecture Summary

The project is a **hybrid single-server** application with two main parts:

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Mobile Client (Expo)                   │
│  React Native + Expo Router + TypeScript                   │
│                                                            │
│  View (Screen)  →  Controller (Service)  →  Model (Types)  │
│  (features/*) (features/*/services/)  (features/*/types/)  │
└───────────────────────────┬────────────────────────────────┘
                            │ HTTP / Socket.io
                            ▼
┌────────────────────────────────────────────────────────────┐
│                  Backend (Express.js)                      │
│  Node.js + Express + mssql (SQL Server driver)             │
│                                                            │
│  Route  →  Controller  →  Service  →  SQL / Stored Proc    │
│  (routes/*)  (controllers/*) (services/*)  (database)      │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│              Database  (Microsoft SQL Server)              │
│  Multi-tenant: GDB (shared/config) + SFC/FEEDPRO/PET1      │
│  (multi-company via company-specific DB pools)             │
└────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **No ORM** — The server uses `mssql` directly with parameterized queries and
  stored procedures. There is no Sequelize/Prisma/TypeORM layer.
- **No dedicated `models/` directory** — The "Model" is represented by inline
  SQL, stored procedures, TypeScript interfaces, and a dynamic `schema` introspection
  endpoint. See [§5 Where's the MVC?](#5-wheres-the-mvc) for the full mapping.
- **Singleton service pattern** — Frontend API services and backend service
  classes use a singleton (`getInstance()`) pattern.
- **Multi-tenant database** — Different companies (SFC, FEEDPRO, PET1) map to
  different SQL Server databases (`DB_SFC`, `DB_FEEDPRO`, `DB_PET1`). The `GDB`
  database holds shared/system data.
- **File-based routing** — The frontend uses [Expo Router](https://expo.dev/router)
  with file-based routing under the `app/` directory.
- **TLS 1.0 compatibility** — The server patches `crypto.createSecureContext`
  for SQL Server 2005 compatibility (see `server/src/app.js`).

---

## 3. Technology Stack

### Frontend (Mobile App — `/`)

| Layer | Technology |
|---|---|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Routing | expo-router 6 |
| Language | TypeScript 5.9 |
| HTTP Client | axios 1.13 |
| Real-time | socket.io-client 4.8 |
| Styling | Tailwind CSS (via `tailwind-merge`), `react-native-web` |
| Camera | expo-camera, react-native-vision-camera |
| Animations | react-native-reanimated 4, framer-motion |
| Notifications | expo-notifications |
| Build | EAS (Expo Application Services) |
| Icons | lucide-react-native, @expo/vector-icons |

### Backend (Server — `/server`)

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database Driver | mssql 12 (SQL Server / TDS) |
| Real-time | socket.io 4 |
| Environment | dotenv |
| CORS | cors |

### Database

| Component | Details |
|---|---|
| DBMS | Microsoft SQL Server |
| Multi-tenant | `GDB` (shared/system), `SFC`, `FEEDPRO`, `PET1` (company-specific) |
| Connection | Pooled connections via `mssql.ConnectionPool` |

---

## 4. Project Structure

### Top-Level Layout

```
erpMobile/
├── app/                         # Expo Router routes (file-based) → Views / entry points
│   ├── _layout.tsx              # Root layout (AuthProvider, ToastProvider, theme, nav)
│   ├── auth.tsx                 # Login screen route
│   ├── notifications.tsx        # Notifications screen route
│   ├── coming-soon.tsx          # Placeholder
│   ├── (tabs)/                  # Tab navigator
│   │   ├── _layout.tsx          # Tab bar layout
│   │   ├── index.tsx
│   │   ├── supplies-dept.tsx
│   │   ├── production-dept.tsx
│   │   ├── profile/index.tsx
│   │   └── help/index.tsx
│   ├── raw-materials-dept/      # RM department routes
│   ├── supplies-dept/           # Supplies department routes
│   └── production-dept/         # Production department routes
│
├── features/                    # Feature-based modules (View + Controller + Model)
│   ├── auth/
│   ├── notification/
│   ├── help-support/
│   ├── profile/
│   ├── raw-materials-dept/
│   ├── supplies-dept/
│   ├── production-dept/
│   └── shared/
│
├── components/                  # Reusable UI components (shared across features)
├── constants/                   # theme.ts (design tokens / color palette)
├── core/services/               # Core AuthService (reference)
├── lib/                         # Shared libs (auth.service.ts, db.ts reference, utils.ts)
├── hooks/                       # Custom React hooks (useLogin, useToast, useColorScheme, etc.)
├── shared/                      # Shared UI components (ui/, LoadingScreen, ComingSoonScreen)
├── server/                      # Express.js backend
│   └── src/
│       ├── index.js             # Server entry point (listen + socket init)
│       ├── app.js               # Express app (CORS, middleware, route mounting)
│       ├── config/
│       │   └── database.js      # MSSQL connection pool manager
│       ├── socket.js            # Socket.io initialization
│       ├── utils/               # socketEvents.js, notificationService.js, companyDb.js
│       └── modules/             # Backend feature modules (MVC)
│           ├── auth/
│           ├── schema/
│           ├── notification/
│           ├── raw-materials-dept/
│           ├── supplies-dept/
│           └── production-dept/
│
├── assets/                      # Images, fonts
├── eas.json                     # EAS build configuration
├── app.json                     # Expo config (app name, icons, Splash, plugins)
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript (path alias: @/* → ./*)
├── babel.config.js
├── metro.config.js
├── eslint.config.js
└── .env                         # Environment variables (DB creds, API URL, ports)
```

### Frontend Feature Module Shape

Each feature under `features/<dept>/<feature>/` follows a consistent internal
structure:

```
features/supplies-dept/issuance/
├── IssuanceScreen.tsx           # View — main screen component
├── services/
│   └── issuanceService.ts        # Controller — API client (axios singleton)
├── types/
│   └── issuance.types.ts         # Model — TypeScript interfaces
└── components/
    ├── IssuanceHeader.tsx        # Sub-view — header form
    ├── IssuanceDetails.tsx       # Sub-view — line-item details
    ├── ItemCodeModal.tsx
    ├── MachineNoModal.tsx
    ├── CustomDatePicker.tsx
    └── TimeField.tsx
```

### Backend Module Shape

Each module under `server/src/modules/<module>/` follows a controller/routes
structure, with optional `services/`:

```
server/src/modules/production-dept/material-utilization/
├── controller/
│   └── materialUtilizationController.js   # Controller — request handlers (inline SQL)
├── routes/
│   └── materialUtilizationRoutes.js       # Router — URL → Controller mapping
└── (no services/ — SQL lives in controller)
```

> **Note on naming inconsistency:** Some backend modules use `controllers/`
> (plural) and others use `controller/` (singular). Both are used interchangeably
> across the codebase:
> - `controllers/` (plural): `auth`, `raw-materials-dept/warehouse`,
>   `raw-materials-dept/forklift-operator`, `raw-materials-dept/issuance`,
>   `supplies-dept/issuance`
> - `controller/` (singular): `raw-materials-dept/material-issuance-confirmation`,
>   `notification`, `production-dept/material-issuance`,
>   `production-dept/material-issuance-request-review`,
>   `production-dept/material-utilization`,
>   `production-dept/material-utilization-tag`

---

## 5. Where's the MVC?

This project implements **MVC (Model-View-Controller)** across both the backend
and frontend, though the "Model" is not represented by a traditional ORM model
layer. Below is the complete mapping of where each MVC component lives.

---

### 5.1 Backend (Server) MVC Mapping

The backend uses a **Route → Controller → Service → Database** flow. Express
routes act as the dispatcher, controllers are the request handlers, services
encapsulate query logic (where present), and the database + schema module
represent the model.

| MVC Layer | What it Represents | Location | File Extension |
|---|---|---|---|
| **Model** | SQL queries, stored procedures, database schema, table/column metadata | `server/src/modules/**/controller/*.js` (inline SQL), `server/src/modules/**/services/*.js` (query logic), `server/src/modules/schema/`, `server/src/config/database.js` | `.js` |
| **View** | Not applicable on backend — backend returns JSON (the "view" is the JSON response consumed by the frontend) | N/A | — |
| **Controller** | Request handler functions that receive HTTP requests, orchestrate DB calls, and send responses | `server/src/modules/**/controllers/*.js` or `controller/*.js` | `.js` |
| **Router** | Express routers mapping URL paths + HTTP methods to controller handlers | `server/src/modules/**/routes/*.js` | `.js` |
| **Service** (optional) | Reusable business/query logic classes with static methods that encapsulate SQL | `server/src/modules/**/services/*.js` | `.js` |

#### Concrete Examples — Material Utilization Module (Backend)

```
server/src/modules/production-dept/material-utilization/
├── controller/materialUtilizationController.js  ← MODEL + CONTROLLER (inline SQL + request handling)
├── routes/materialUtilizationRoutes.js          ← ROUTER (URL → Controller mapping)
└── (no services/ subdirectory)
```

- **Model**: SQL queries & stored procedures inside the controller, e.g.
  `queries against [PRODUCTION.USAGEHEADER]`, `[PRODUCTION.USAGEDETAILS]`,
  stored procedure `[2026.spProducationMaterialUtilizationSave]`
- **View**: JSON responses like `res.json({ success: true, data: result.recordset })`
- **Controller**: `materialUtilizationController.js` — exports handler functions
  like `getMaterialUtilization`, `saveMaterialUtilization`, `setComplete`
- **Router**: `materialUtilizationRoutes.js` — e.g.
  `router.get('/get-material-utilization-lists', Controller.getMaterialUtilization)`

#### Backend MVC File Inventory

| Module | Controller | Routes | Service? |
|---|---|---|---|
| `auth` | `controllers/authController.js` | `routes/authRoutes.js` | Yes — `services/authService.js` |
| `schema` | inline in `routes/schemaRoutes.js` | `routes/schemaRoutes.js` | No |
| `notification` | `controller/notificationController.js` | `routes/notificationRoutes.js` | No |
| `raw-materials-dept/warehouse` | `controllers/warehouseController.js` | `routes/warehouseRoutes.js` | Yes — `services/warehouseService.js` |
| `raw-materials-dept/issuance` | `controllers/issuanceController.js` | `routes/issuanceRoutes.js` | No |
| `raw-materials-dept/material-issuance-confirmation` | `controller/materialIssuanceConfirmationController.js` | `routes/materialIssuanceConfirmationRoutes.js` | No |
| `raw-materials-dept/forklift-operator` | `controllers/forkliftOperatorController.js` | `routes/forkliftOperatorRoutes.js` | Yes — `services/forkliftOperatorService.js` |
| `supplies-dept/issuance` | `controllers/issuanceController.js` | `routes/issuanceRoutes.js` | No |
| `production-dept/material-issuance` | `controller/materialIssuanceController.js` | `routes/materialIssuanceRoutes.js` | No |
| `production-dept/material-issuance-request-review` | `controller/materialIssuanceRequestReviewController.js` | `routes/materialIssuanceRequestReviewRoutes.js` | No |
| `production-dept/material-utilization` | `controller/materialUtilizationController.js` | `routes/materialUtilizationRoutes.js` | No |
| `production-dept/material-utilization-tag` | `controller/materialUtilizationTagController.js` | `routes/materialUtilizationTagRoutes.js` | No |

---

### 5.2 Frontend (Mobile App) MVC Mapping

The frontend follows a **feature-sliced** architecture where each feature
contains its own Model, View, and Controller.

| MVC Layer | What it Represents | Location | File Extension |
|---|---|---|---|
| **Model** | TypeScript interfaces describing API request/response data structures | `features/**/types/*.types.ts` | `.ts` |
| **View** | React Native components that render the UI | `features/**/*Screen.tsx`, `features/**/components/*`, `app/*.tsx`, `app/**/*.tsx` | `.tsx` |
| **Controller** | API service classes that make HTTP requests via `axios` (singleton pattern) | `features/**/services/*.ts` | `.ts` |
| **State / Context** | Shared auth state via React Context | `features/auth/context/AuthContext.tsx` | `.tsx` |

#### Concrete Example — Material Utilization Module (Frontend)

```
features/production-dept/material-utilization/
├── MaterialUtilizationScreen.tsx              ← VIEW (main screen, orchestrates sub-views)
├── services/materialUtilizationService.ts    ← CONTROLLER (axios API client)
├── types/materialUtilization.types.ts        ← MODEL (TypeScript interfaces)
└── components/
    ├── MaterialUtilizationHeader.tsx          ← VIEW (form header)
    ├── MaterialUtilizationBaseDetails.tsx     ← VIEW (line items form)
    ├── MaterialUtilizationDetails.tsx         ← VIEW (detail editor)
    ├── MaterialUtilizationDetailsUpdate.tsx   ← VIEW (detail updater)
    ├── MaterialUtilizationBatchLists.tsx      ← VIEW (batch list)
    ├── MaterialUtilizationBatchDetails.tsx    ← VIEW (batch detail)
    ├── MaterialUtilizationForPosting.tsx      ← VIEW (posting list)
    ├── MaterialUtilizationDoneLists.tsx       ← VIEW (done lists)
    ├── MaterialUtilizationDoneDetails.tsx     ← VIEW (done details)
    ├── MaterialUtilizationDoneModal.tsx       ← VIEW (completion modal)
    └── MaterialUtilizationList.tsx            ← VIEW (main list)
```

- **Model**: `materialUtilization.types.ts` defines interfaces like
  `MaterialUtilizationFormData`, `MaterialUtilizationLineItem`,
  `MaterialUtilizationPayload`, `BatchDetail`, `MaterialUtilizationPostResponse`
- **View**: `MaterialUtilizationScreen.tsx` renders the UI by composing
  sub-view components; it calls the service layer and manages local state
- **Controller**: `materialUtilizationService.ts` — `MaterialUtilizationService`
  singleton that makes `axios` calls to the backend API and returns typed data

#### Frontend Feature → Route Mapping

| Frontend Feature | Route File |
|---|---|
| `auth` | `app/auth.tsx` |
| `notification` | `app/notifications.tsx` |
| `help-support` | `app/(tabs)/help/index.tsx` |
| `profile` | `app/(tabs)/profile/index.tsx` |
| `raw-materials-dept/stock-balance` | `app/raw-materials-dept/stock-balance.tsx` |
| `raw-materials-dept/posted-warehouse-confirmation` | `app/raw-materials-dept/posted-warehouse-confirmation.tsx` |
| `raw-materials-dept/pending-warehouse-confirmation` | `app/raw-materials-dept/pending-warehouse-confirmation.tsx` |
| `raw-materials-dept/material-issuance-confirmation` | `app/raw-materials-dept/material-issuance-confirmation.tsx` |
| `raw-materials-dept/issuance-verification` | `app/raw-materials-dept/issuance-verification.tsx` |
| `raw-materials-dept/forklift-operator` | `app/raw-materials-dept/forklift-operator.tsx`, `.../forklift-operator-form.tsx` |
| `raw-materials-dept/reports` | `app/raw-materials-dept/reports.tsx` |
| `raw-materials-dept/settings` | `app/raw-materials-dept/settings.tsx` |
| `raw-materials-dept/home` | `app/(tabs)/index.tsx` (or `app/(tabs)/supplies-dept.tsx` based on DEPTCODE) |
| `supplies-dept/home` | `app/(tabs)/supplies-dept.tsx` |
| `supplies-dept/issuance` | `app/supplies-dept/supplies-issuance.tsx` |
| `supplies-dept/posted-issuance` | `app/supplies-dept/posted-issuance.tsx` |
| `production-dept/home` | `app/(tabs)/production-dept.tsx` |
| `production-dept/material-utilization` | `app/production-dept/material-utilization.tsx` |
| `production-dept/material-utilization-tag` | `app/production-dept/material-utilization-tag.tsx` |
| `production-dept/material-issuance` | `app/production-dept/material-issuance.tsx` |
| `production-dept/material-issuance-request-review` | `app/production-dept/material-issuance-request-review.tsx` |
| `production-dept/material-issuance-confirmation` | `app/production-dept/material-issuance-confirmation.tsx` |

---

### 5.3 End-to-End Request Flow

The following example traces a "save material utilization" request through
both the frontend and backend MVC layers:

```
User clicks "Save and Post" in MaterialUtilizationScreen
    │
    ▼ 1. VIEW — MaterialUtilizationScreen.tsx calls handleConfirmSubmit()
    │    Builds a typed MaterialUtilizationPayload
    │
    ▼ 2. CONTROLLER — MaterialUtilizationService.saveMaterialUtilization()
    │    (features/production-dept/material-utilization/services/materialUtilizationService.ts)
    │    Makes axios POST to /production-dept/material-utilization/save-material-utilization
    │
 ┌─────────────────────────────┐
 │    HTTP Request / Response  │
 └────────────┬────────────────┘
              ▼
    ▼ 3. ROUTER — materialUtilizationRoutes.js
    │    router.post('/save-material-utilization', Controller.saveMaterialUtilization)
    │
    ▼ 4. CONTROLLER — materialUtilizationController.js (backend)
    │    exports.saveMaterialUtilization = async (req, res) => { ... }
    │    Parses req.body, validates, builds XML, executes stored procedure
    │
    ▼ 5. MODEL — SQL Server stored procedure [2026.spProducationMaterialUtilizationSave]
    │    Via mssql pool.request().execute(...)
    │
    ▼ 6. Controller receives SP result, sends JSON response
    │
    ▼ 7. Service receives response, returns typed data
    ▼ 8. View updates state / shows SuccessModal
```

---

## 6. Department / Module Catalog

### 6.1 Backend Modules

All backend modules live under `server/src/modules/`. The central router
registration happens in `server/src/app.js` (lines 64–93).

| Route Prefix | Module Path | Purpose |
|---|---|---|
| `/login`, `/health` | `server/src/modules/auth` | Authentication & health check |
| `/schema` | `server/src/modules/schema` | Dynamic database schema introspection (tables & columns) |
| `/warehouse` | `server/src/modules/raw-materials-dept/warehouse` | Stock balance & dashboard metrics |
| `/issuance` | `server/src/modules/raw-materials-dept/issuance` | Raw materials issuance (FIFO allocation) |
| `/supplies/issuance` | `server/src/modules/supplies-dept/issuance` | Internal supplies issuance & posted records |
| `/forklift-operators` | `server/src/modules/raw-materials-dept/forklift-operator` | Forklift operator CRUD |
| `/production-dept/material-issuance` | `server/src/modules/production-dept/material-issuance` | Material issuance request (MIR) creation |
| `/production-dept/material-issuance-request-review` | `server/src/modules/production-dept/material-issuance-request-review` | Review MIR requests |
| `/raw-materials-dept/material-issuance-confirmation` | `server/src/modules/raw-materials-dept/material-issuance-confirmation` | RM issuance confirmation (preparing/prepared/served/confirmed) |
| `/production-dept/material-utilization` | `server/src/modules/production-dept/material-utilization` | Production material usage recording & posting |
| `/production-dept/material-utilization-tag` | `server/src/modules/production-dept/material-utilization-tag` | Tag toggle (inventory tagging flag) |
| `/notification` | `server/src/modules/notification` | Notification fetch & acknowledgement |

### 6.2 Frontend Features

All frontend features live under `features/`. Routing entries are in `app/`.

| Feature Path | Route | Department | Description |
|---|---|---|---|
| `features/auth` | `app/auth.tsx` | All | Login screen, credential validation |
| `features/notification` | `app/notifications.tsx` | All | Real-time notification display |
| `features/help-support` | `app/(tabs)/help/index.tsx` | All | Help & support screen |
| `features/profile` | `app/(tabs)/profile/index.tsx` | All | User profile view |
| `features/raw-materials-dept/home` | `app/(tabs)/index.tsx` | Raw Materials | Warehouse home dashboard |
| `features/raw-materials-dept/stock-balance` | `app/raw-materials-dept/stock-balance.tsx` | Raw Materials | Real-time stock balance view |
| `features/raw-materials-dept/pending-warehouse-confirmation` | `app/raw-materials-dept/pending-warehouse-confirmation.tsx` | Raw Materials | Pending QM4 confirmations |
| `features/raw-materials-dept/posted-warehouse-confirmation` | `app/raw-materials-dept/posted-warehouse-confirmation.tsx` | Raw Materials | Posted confirmation records |
| `features/raw-materials-dept/material-issuance-confirmation` | `app/raw-materials-dept/material-issuance-confirmation.tsx` | Raw Materials | RM issuance confirmation workflow |
| `features/raw-materials-dept/issuance-verification` | `app/raw-materials-dept/issuance-verification.tsx` | Raw Materials | Barcode-based issuance verification |
| `features/raw-materials-dept/forklift-operator` | `app/raw-materials-dept/forklift-operator.tsx` | Raw Materials | Forklift operator list & form |
| `features/raw-materials-dept/reports` | `app/raw-materials-dept/reports.tsx` | Raw Materials | Reports & analytics |
| `features/raw-materials-dept/settings` | `app/raw-materials-dept/settings.tsx` | Raw Materials | Settings page |
| `features/supplies-dept/home` | `app/(tabs)/supplies-dept.tsx` | Supplies | Supplies home dashboard |
| `features/supplies-dept/issuance` | `app/supplies-dept/supplies-issuance.tsx` | Supplies | Internal supplies issuance |
| `features/supplies-dept/posted-issuance` | `app/supplies-dept/posted-issuance.tsx` | Supplies | Posted issuance records |
| `features/production-dept/home` | `app/(tabs)/production-dept.tsx` | Production | Production home dashboard |
| `features/production-dept/material-utilization` | `app/production-dept/material-utilization.tsx` | Production | Material usage recording & posting |
| `features/production-dept/material-utilization-tag` | `app/production-dept/material-utilization-tag.tsx` | Production | Inventory tagging toggle |
| `features/production-dept/material-issuance` | `app/production-dept/material-issuance.tsx` | Production | Material issuance request (MIR) |
| `features/production-dept/material-issuance-request-review` | `app/production-dept/material-issuance-request-review.tsx` | Production | MIR review screen |
| `features/production-dept/material-issuance-confirmation` | `app/production-dept/material-issuance-confirmation.tsx` | Production | Production issuance confirmation |
| `features/shared` | — | All | Shared socket & notification services |

---

## 7. Backend Deep Dive

### 7.1 Application Entry Point

**`server/index.js`** — Bootstraps the server:
1. Requires `app.js` (Express app)
2. Calls `getPool(DEFAULT_DB)` to warm up the database connection
3. Starts listening on `PORT` (default 3000) bound to `0.0.0.0`
4. Initializes Socket.io via `initializeSocket(server)`
5. Handles graceful shutdown on `SIGINT` (closes DB pool + server)

Key startup note (line 25): If TLS/SSL errors occur, run with
`node --openssl-legacy-provider server/index.js` (the `npm run server` script
already includes this flag).

**`server/src/app.js`** — Configures the Express application:
1. **TLS patch** for SQL Server 2005 compatibility (lines 3–13)
2. Loads `.env` from project root
3. Configures CORS (allows `EXPO_PUBLIC_API_URL`, localhost dev ports)
4. Mounts global middleware (`cors`, `express.json`, request logger)
5. Imports and mounts all module routers (lines 64–93)
6. Defines direct routes: `GET /health`, `POST /login`, `GET /test-db`, `GET /stock-balance`
7. Error-handling middleware (lines 135–142)

### 7.2 Database Connection

**`server/src/config/database.js`** — Manages MSSQL connection pools:

- Uses the `mssql` npm package
- `baseConfig` holds `server`, `user`, `password` from `.env` (`DB_HOST`, `DB_USER`, `DB_PASSWORD`)
- **Pool caching**: `poolMap` stores one `ConnectionPool` per database name;
  duplicate connections are prevented via `connectingMap`
- `getPool(dbName)` — async function returning a connected pool for a given DB
- `closePool()` — closes all pools (used on shutdown)
- Connection options: `encrypt: false`, `trustServerCertificate: true`,
  `connectionTimeout: 10000`, `requestTimeout: 15000`

### 7.3 Multi-Tenant Company Mapping

**`server/src/utils/companyDb.js`** — Maps company codes to database names:

```js
const COMPANY_DB_ENV = {
  SFC: 'DB_SFC',
  FEEDPRO: 'DB_FEEDPRO',
  PET1: 'DB_PET1',
};

function getCompanyDbName(company) {
  const envKey = COMPANY_DB_ENV[(company || '').toUpperCase()];
  return (envKey && process.env[envKey]) || process.env.DB_GDB || 'GDB';
}
```

This is used pervasively in controllers — e.g.
`const dbName = getCompanyDbName(company); const pool = await getPool(dbName);`

The `company` value is passed as a query parameter (`?company=SFC`) from the
frontend, enabling per-request multi-tenant database selection. The `GDB`
database is the fallback and holds shared/system tables.

### 7.4 Real-Time (Socket.io)

**`server/src/socket.js`** — Initializes a `socket.io` server on the HTTP
server with permissive CORS (`origin: '*'`). Emits connection/disconnect logs.
Exports `getIO()` for use elsewhere.

**`server/src/utils/socketEvents.js`** — Helper functions:
- `emitMaterialIssuanceUpdate(eventType, data)` — broadcasts to all clients
  on `'material-issuance:update'` and `'material-issuance:<eventType>'`
- `emitNotification(notification)` — broadcasts on `'notification'`

These are called from controllers when state changes (e.g. marking an item
prepared/served/confirmed triggers `'prepared'`/`'served'`/`'confirmed'` events).

### 7.5 Configuration (`.env`)

| Variable | Purpose | Example |
|---|---|---|
| `DB_HOST` | SQL Server host | `127.0.0.1` |
| `DB_USER` | SQL Server user | `sa` |
| `DB_PASSWORD` | SQL Server password | *(secret)* |
| `DB_GDB` | Shared/system database name | `GDB` |
| `DB_SFC` | SFC company database | `SFC` |
| `DB_FEEDPRO` | FeedPro company database | `FEEDPRO` |
| `DB_PET1` | PET1 company database | `PET1` |
| `PORT` | Server port | `3000` |
| `EXPO_PUBLIC_API_URL` | Frontend → Backend API URL | `http://192.168.10.85:3000` |

> The frontend reads its API base URL from `Constants.expoConfig?.extra?.apiUrl`
> (configured in `app.json` under `expo.extra.apiUrl`), which is set from
> `EXPO_PUBLIC_API_URL` at build/runtime.

---

## 8. Frontend Deep Dive

### 8.1 Routing (Expo Router)

The app uses **Expo Router** with file-based routing rooted in `app/`. The root
layout (`app/_layout.tsx`) wraps the entire app in:

- `AuthProvider` (from `AuthContext.tsx`) — provides user/auth state
- `ToastProvider` (from shared UI) — toast notifications
- `ThemeProvider` (from React Navigation) — dark/light theme
- `SafeAreaProvider` (from `react-native-safe-area-context`)

**Navigation flow** (in `_layout.tsx`, lines 66–82):
- Splash/loading screen shown until `isAppReady` (simulated 1.1s init)
- If not authenticated → redirect to `/auth`
- If authenticated and in auth group → redirect based on `user.DEPTCODE`:
  - `OPPROD` → `/(tabs)/production-dept`
  - `PAWHSP` → `/(tabs)/supplies-dept`
  - default → `/(tabs)` (raw materials)

The tab navigator (`app/(tabs)/_layout.tsx`) has 3 main tabs:
- **Help** (`help/index`) — with admin home-menu dropdown
- **Home** (`index`) — role-aware routing to department dashboards
- **Profile** (`profile/index`)

Additional stack screens are declared in the root layout for department-specific
full-screen routes.

### 8.2 Authentication Flow

```
app/auth.tsx
  → useLogin() hook  (hooks/use-login.ts)
    → AuthService (lib/auth.service.ts OR core/services/auth/authService.ts)
      → POST /login  (server: AuthController.login)
        → AuthService.authenticateUser()  (server: authService.js)
          → SELECT * FROM [SYSTEM.USERACCOUNT] WHERE USERNAME/PASSWORD
```

The auth state is stored in React Context (`AuthContext.tsx`):
- `user: UserAccount | null`
- `isAuthenticated: boolean`
- `isAdmin: boolean` (derived from `USERLEVEL === 'ADMINISTRATOR'`)
- `setUser(user)` / `logout()`

The user's `COMPANY` is passed through context and forwarded as a query param
to every backend API call.

> **Note:** There are two AuthService implementations — `lib/auth.service.ts`
> and `features/auth/services/authService.ts` — both are nearly identical
> singletons calling `POST /login`. The `hooks/use-login.ts` uses
> `lib/auth.service.ts`; the `features/auth/services/authService.ts` also
> includes `postLoginHistory`. The `core/services/auth/authService.ts`
> (longest variant) is a reference implementation with detailed error handling.

### 8.3 API Service Layer

Every feature has a **service singleton** class that uses `axios` to communicate
with the backend. Common pattern:

```typescript
export class SomeFeatureService {
  private static instance: SomeFeatureService;
  private baseUrl: string; // from Constants.expoConfig?.extra?.apiUrl

  private constructor() {
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
  }

  static getInstance(): SomeFeatureService { ... }

  async getSomething(company?: string): Promise<...> {
    const response = await axios.get(`${this.baseUrl}/...`, { params: { company } });
    return response.data;
  }
}

export const someFeatureService = SomeFeatureService.getInstance();
```

The `baseUrl` is read from Expo's `extra.apiUrl` config (set in `app.json` from
`EXPO_PUBLIC_API_URL`).

### 8.4 Data Types (Models)

Each feature defines TypeScript interfaces in `types/*.types.ts`. These
represent the **Model** layer — they describe the shape of data flowing
between frontend and backend. Examples:

- `features/auth/types/auth.types.ts` → `UserAccount`, `LoginRequest`, `LoginResponse`
- `features/supplies-dept/issuance/types/issuance.types.ts` → `PostIssuancePayload`, `IssuanceLineItem`, `ItemCodeResponse`, etc.
- `features/production-dept/material-utilization/types/materialUtilization.types.ts` → `MaterialUtilizationPayload`, `BatchingMaterialUtilization`, `MaterialUtilizationLineItem`, `BatchDetail`, `MaterialUtilizationPostResponse`, etc.

### 8.5 Shared Components & Hooks

**Shared Components** (`components/` and `shared/components/`):
- `ConfirmModal.tsx` — reusable confirmation dialog
- `SuccessModal.tsx` — success result dialog
- `LoadingScreen.tsx` — splash/loading indicator
- `ComingSoonScreen.tsx` — placeholder
- `ui/` — themed UI primitives (modal-dialog, login inputs, toast)
- `TimePickerModal.tsx`, `DatePickerModal.tsx` — date/time pickers
- `ItemCodeModal.tsx`, `CancelRemarks.tsx` — domain-specific modals

**Hooks** (`hooks/`):
- `use-login.ts` — login form state + authentication
- `use-toast.ts` — toast notification state management
- `use-theme-color.ts` — color scheme hook
- `use-network-status.ts` — network connectivity
- `use-color-scheme.ts` / `use-color-scheme.web.ts` — dark/light mode

**Shared Services** (`features/shared/`):
- `features/shared/services/socketService.ts` — Socket.io client singleton
  (`socketService`); listens for `'material-issuance:update'` and
  `'notification'` events
- `features/shared/services/notificationService.ts` — notification helpers

**Design Tokens** (`constants/theme.ts`):
- `Colors` — light and dark theme color palettes with enterprise status colors
  (preparing, prepared, served, etc.)
- `Fonts` — platform-specific font families

---

## 9. Feature Walkthroughs

### 9.1 Supplies Dept — Issuance

**Purpose:** Internal supplies issuance — employees scan/select items and
allocate quantities from available stock. Handles FIFO lot allocation, department/
area/project routing, machine number assignment, and posting.

**Files involved:**

| Layer | File | Role |
|---|---|---|
| View | `features/supplies-dept/issuance/IssuanceScreen.tsx` | Main screen; orchestrates header + details, handles submission flow with confirmation modals |
| View (sub-components) | `features/supplies-dept/issuance/components/IssuanceHeader.tsx` | Header form (date, shift, dept, area, project, personnel) |
| View (sub-components) | `features/supplies-dept/issuance/components/IssuanceDetails.tsx` | Line-item editor with allocation table |
| View (sub-components) | `components/ItemCodeModal.tsx`, `MachineNoModal.tsx`, `CustomDatePicker.tsx`, `TimeField.tsx` | Domain-specific input modals |
| Controller | `features/supplies-dept/issuance/services/issuanceService.ts` | axios Service singleton: `getItemCodes`, `postIssuance`, `validateIssuanceDate`, `getAreaOption`, `getProjectNameOption`, etc. |
| Model | `features/supplies-dept/issuance/types/issuance.types.ts` | Interfaces: `PostIssuancePayload`, `PostIssuanceDetail`, `IssuanceFormData`, `AssignQuantityAllocation`, etc. |
| Backend Controller | `server/src/modules/supplies-dept/issuance/controllers/issuanceController.js` | HTTP handlers for dept-code, item lookup, issuance posting, posted records |
| Backend Router | `server/src/modules/supplies-dept/issuance/routes/issuanceRoutes.js` | Routes under `/supplies/issuance` |
| Posted Issuance View | `features/supplies-dept/posted-issuance/PostedIssuanceScreen.tsx` | View posted issuance records |
| Posted Issuance Controller | `features/supplies-dept/posted-issuance/services/postedIssuanceService.ts` | API for fetching posted records |
| Posted Issuance Model | `features/supplies-dept/posted-issuance/types/posted-issuance.types.ts` | Type definitions |

**Workflow:**
1. User selects date, shift, department, area, project
2. User adds item codes (scanned or selected from dropdown)
3. For each item, the system shows available lots (allocation table with FIFO)
4. User assigns quantities to lots
5. User submits → confirmation modal → `POST /supplies/issuance/post`
6. Backend validates date (3-day window), inserts header + details, updates
   stock quantities in a **transaction**
7. On success, reference number displayed; on "insufficient stock" error, the
   item quantities are refreshed

### 9.2 Production Dept — Material Utilization

**Purpose:** Record raw material usage during production. Supports base details
(header + required materials), dosing vs non-dosing machine batching, posting
workflow, and a "mark as done" completion step.

**Files involved:**

| Layer | File | Role |
|---|---|---|
| View | `features/production-dept/material-utilization/MaterialUtilizationScreen.tsx` | Central screen; manages list/form/batch/posting/done views + modals |
| View (sub-components) | `components/MaterialUtilizationHeader.tsx` | Header form (usage date, machine line, shift, feed type, variant) |
| View (sub-components) | `components/MaterialUtilizationBaseDetails.tsx` | Base material line items |
| View (sub-components) | `components/MaterialUtilizationDetails.tsx`, `MaterialUtilizationDetailsUpdate.tsx` | Batch detail editor |
| View (sub-components) | `components/MaterialUtilizationBatchLists.tsx`, `MaterialUtilizationBatchDetails.tsx` | Batch navigation |
| View (sub-components) | `components/MaterialUtilizationForPosting.tsx`, `MaterialUtilizationDoneLists.tsx`, `MaterialUtilizationDoneDetails.tsx`, `MaterialUtilizationDoneModal.tsx`, `MaterialUtilizationList.tsx` | Posting/done views |
| Controller | `features/production-dept/material-utilization/services/materialUtilizationService.ts` | axios Service singleton (caching for machine lines & variants) |
| Model | `features/production-dept/material-utilization/types/materialUtilization.types.ts` | Interfaces: `MaterialUtilizationPayload`, `BatchingMaterialUtilization`, `MaterialUtilizationLineItem`, `BatchDetail`, `MaterialUtilizationPostResponse`, etc. |
| Backend Controller | `server/src/modules/production-dept/material-utilization/controller/materialUtilizationController.js` | SQL queries against `PRODUCTION.USAGEHEADER`, `PRODUCTION.USAGEDETAILS`, `PRODUCTION.USAGEBASEDETAILS`; executes SP `[2026.spProducationMaterialUtilizationSave]` |
| Backend Router | `server/src/modules/production-dept/material-utilization/routes/materialUtilizationRoutes.js` | 20+ routes under `/production-dept/material-utilization` |
| Tag Controller | `server/src/modules/production-dept/material-utilization-tag/controller/materialUtilizationTagController.js` | Tag toggle for `PRODUCTION.USAGETAG` table; `getTagValue` imported by MU controller |

**Key backend detail:** The controller exports a `getTagValue(company)` function
(line 21 of `materialUtilizationTagController.js`) that is imported and reused by
`materialUtilizationController.js` (line 4) — this is a cross-module dependency
where the tag value determines whether inventory sub-detail allocation is required.

**Transaction Types:**
- `transType = 1` — Save header + base details (new record)
- `transType = 2` — Save batching details (posting)
- `transType = 3` — Update batching details (existing)
- `transType = 4` — Update via frontend `BatchingMaterialUtilization`

### 9.3 Raw Materials Dept — Warehouse & Issuance Confirmation

**Purpose:** Warehouse operators confirm material receipt, view stock balance,
verify issuances via barcode scanning, and manage forklift operators.

**Files involved:**

| Layer | File | Role |
|---|---|---|
| View | `features/raw-materials-dept/home/WarehouseHomeScreen.tsx` | RM home dashboard |
| View | `features/raw-materials-dept/stock-balance/screens/StockBalanceScreen.tsx` | Real-time stock balance |
| View | `features/raw-materials-dept/material-issuance-confirmation/MaterialIssuanceConfirmationScreen.tsx` | RM issuance confirmation workflow (preparing/prepared/served/confirmed/cancel) |
| View | `features/raw-materials-dept/issuance-verification/screens/IssuanceVerificationScreen.tsx` | Barcode-based verification with allocation table |
| View | `features/raw-materials-dept/forklift-operator/screens/ForkliftOperatorListScreen.tsx`, `ForkliftOperatorFormScreen.tsx` | Forklift operator management |
| Controller | `features/raw-materials-dept/home/services/warehouseMetricsService.ts` | Dashboard metrics |
| Controller | `features/raw-materials-dept/stock-balance/services/stockBalanceService.ts` | Stock balance API client |
| Controller | `features/raw-materials-dept/material-issuance-confirmation/services/materialIssuanceConfirmationService.ts` | Issuance confirmation API client |
| Controller | `features/raw-materials-dept/forklift-operator/services/forkliftOperatorService.ts` | Forklift operator CRUD |
| Model | `*types/*.types.ts` in each feature | Type definitions |
| Backend Controller | `server/src/modules/raw-materials-dept/warehouse/controllers/warehouseController.js` | Delegates to WarehouseService |
| Backend Service | `server/src/modules/raw-materials-dept/warehouse/services/warehouseService.js` | SQL queries (metrics, posted/pending transactions, stock balance) |
| Backend Router | `server/src/modules/raw-materials-dept/warehouse/routes/warehouseRoutes.js` | Routes under `/warehouse` + `/stock-balance` |
| Backend Controller | `server/src/modules/raw-materials-dept/material-issuance-confirmation/controller/materialIssuanceConfirmationController.js` | Item state transitions (preparing → prepared → served → confirmed), emits Socket.io events |
| Backend Router | `server/src/modules/raw-materials-dept/material-issuance-confirmation/routes/materialIssuanceConfirmationRoutes.js` | Routes for confirmation workflow |

**Real-time integration:** When an item is confirmed in the RM issuance
confirmation screen, the backend controller calls `emitMaterialIssuanceUpdate`
to broadcast to connected production-dept clients (via `material-issuance:update`
socket event), enabling live updates across departments.

### 9.4 Notifications

**Purpose:** Real-time notification system for inter-department communication
(e.g., material issuance requests, confirmations).

| Layer | File | Role |
|---|---|---|
| View | `features/notification/NotificationsScreen.tsx` | List notifications, acknowledge |
| View | `features/notification/components/NotificationPopUp.tsx` | Popup toast for incoming notifications |
| Shared Service | `features/shared/services/notificationService.ts` | Notification display helpers |
| Backend Controller | `server/src/modules/notification/controller/notificationController.js` | `getNotifications` (SELECT from `SYSTEM.NOTIFICATIONMASTER`), `setAcknowledged` (INSERT to history + DELETE, in transaction) |
| Backend Router | `server/src/modules/notification/routes/notificationRoutes.js` | Routes under `/notification` |

---

## 10. Key Design Patterns

### Singleton Service Pattern
All frontend services and several backend service classes use a singleton:
```typescript
static getInstance(): T {
  if (!Class.instance) Class.instance = new Class();
  return Class.instance;
}
```
Frontend services are exported as ready instances (e.g.,
`export const materialUtilizationService = MaterialUtilizationService.getInstance();`).

### Company-Aware API Calls
Every frontend service method accepts an optional `company` parameter, which is
forwarded as a `?company=` query param to the backend. The backend uses
`getCompanyDbName(company)` to select the correct SQL Server database pool.

### Caching
- `MaterialUtilizationService` caches machine lines (per-company) and feed-type
  variants (per company+feedType) in `Map`/instance variables to avoid
  redundant API calls.
- `IssuanceService` follows the same singleton pattern.

### Transaction Management
Backend controllers use `sql.Transaction` for multi-statement writes (e.g.,
`postIssuance` in the supplies issuance controller, `postIssuance` in RM issuance).
Transactions are committed on success and rolled back on error, with special
handling for `EABORT` errors.

### XML Payload Construction
The material utilization save endpoints build XML payloads
(`<BaseDetails>`, `<Details>`, `<SubDetails>`) from JavaScript objects using an
`escapeXml()` helper, then pass them as `sql.Xml` parameters to stored
procedures.

### Stored Procedure Integration
The material utilization module delegates complex save/update logic to the
SQL Server stored procedure `[2026.spProducationMaterialUtilizationSave]`,
passing typed parameters (`sql.Int`, `sql.NVarChar`, `sql.Xml`, `sql.Decimal`).

### Real-Time Event Broadcasting
Socket.io is used for cross-client state synchronization:
- `emitMaterialIssuanceUpdate` → `material-issuance:update` event + typed sub-events
- `emitNotification` → `notification` event
The frontend `SocketService` listens for both and exposes typed methods
(`onMaterialIssuanceUpdate`, `onNotification`).

### Schema Introspection (Model Layer)
The `/schema` endpoint (`server/src/modules/schema/routes/schemaRoutes.js`)
dynamically introspects the database schema — listing tables and their columns
with data types. This serves as a dynamic "model" layer, used for debugging
column names (the auth controller even references it in error messages:
`"Check /schema/SYSTEM.USERACCOUNT endpoint to verify column names"`).

### Path Aliases
TypeScript path alias `@/*` → `./*` (project root) is configured in
`tsconfig.json`. Used throughout the frontend for imports like
`import { useAuth } from '@/features/auth/context/AuthContext'`.

---

## 11. Running the Project

### Prerequisites
- Node.js
- npm
- SQL Server (reachable at `DB_HOST`)
- Expo CLI (for mobile/web dev)

### Install Dependencies
```bash
npm install
```

### Development (Full Stack)
```bash
npm run dev
```
This runs the backend (`node --openssl-legacy-provider server/index.js`) and the
Expo dev server concurrently.

### Backend Only
```bash
npm run server
```

### Frontend Only
```bash
npm start        # Expo dev server
npm run android  # Run on Android emulator/device
npm run ios      # Run on iOS simulator
npm run web      # Run in web browser
```

### Build (Production)
```bash
npx eas build --platform ios
npx eas build --platform android
```

### Linting
```bash
npm run lint
```

---

## 12. API Reference (Summary)

### Auth
| Method | Endpoint | Backend Handler |
|---|---|---|
| POST | `/login` | `AuthController.login` → `AuthService.authenticateUser` |
| POST | `/auth/login-history` | `AuthController.loginHistory` |
| GET | `/auth/company` | `AuthController.companyLogin` |
| GET | `/health` | `AuthController.healthCheck` |

### Schema (Model Introspection)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/schema` | List all base tables |
| GET | `/schema/:table` | Get columns for a specific table |

### Notification
| Method | Endpoint | Backend Handler |
|---|---|---|
| GET | `/notification/get-notifications` | `NotificationController.getNotifications` |
| GET | `/notification/acknowledge` | `NotificationController.setAcknowledged` |

### Warehouse (Raw Materials)
| Method | Endpoint | Backend Handler |
|---|---|---|
| GET | `/warehouse/metrics` | `WarehouseController.getMetrics` → `WarehouseService` |
| GET | `/warehouse/posted-transactions` | `WarehouseController.getPostedTransactions` |
| GET | `/warehouse/posted-transaction-details` | `WarehouseController.getPostedTransactionDetails` |
| GET | `/warehouse/completed-today` | `WarehouseController.getCompletedToday` |
| GET | `/warehouse/stock-balance` | `WarehouseController.getStockBalance` |
| GET | `/stock-balance` | (direct route → same handler) |

### Supplies Issuance (`/supplies/issuance`)
| Method | Endpoint | Backend Handler |
|---|---|---|
| GET | `/supplies/issuance/dept-code/:scannedApprover` | `getDeptCodeByScannedApprover` |
| GET | `/supplies/issuance/dept-option` | `getDepartmentOption` |
| GET | `/supplies/issuance/next-reference-number` | `getNextReferenceNo` |
| GET | `/supplies/issuance/get-transaction-type` | `getTransactionType` |
| GET | `/supplies/issuance/get-item-code` | `getItemCode` |
| GET | `/supplies/issuance/get-item-details/:itemCode` | `getItemDetails` |
| GET | `/supplies/issuance/get-assigned-quantity-allocation/:itemCode` | `getAssignQuantityAllocation` |
| GET | `/supplies/issuance/get-area-option/:department` | `getAreaOption` |
| GET | `/supplies/issuance/get-project-name/:department/:area` | `getProjectNameOption` |
| GET | `/supplies/issuance/get-machine-no` | `getMachineNo` |
| GET | `/supplies/issuance/is-month-posted/:locationCode/:month/:year` | `isMonthPosted` |
| GET | `/supplies/issuance/get-valid-personnel` | `getValidPersonnel` |
| GET | `/supplies/issuance/validate-date-issuance` | `validatedDate` |
| POST | `/supplies/issuance/post` | `postIssuance` (transactional) |
| GET | `/supplies/issuance/posted-header` | `getPostedIssuanceHeader` |
| GET | `/supplies/issuance/posted-details/:referenceNo` | `getPostedIssuanceDetails` |

### Material Utilization (Production) — `/production-dept/material-utilization`

**List / Read:**
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/get-material-utilization-lists` | Active (not done, posted, approved) utilization records |
| GET | `/get-material-utilization-done-lists` | Completed (IS_DONE=1) records |
| GET | `/get-material-utilization-for-posting` | Records with POSTSTATUS=0 (pending post) |
| GET | `/get-material-utilization-details` | Header + base details (non-dosing) |
| GET | `/get-material-utilization-details-for-posting` | Header + base details for posting edit |
| GET | `/get-material-utilization-dosing-machine-details` | Header + dosing machine details |
| GET | `/get-material-utilization-done-pivot-details` | Done records detail view (header + rows) |
| GET | `/get-next-usage-ref-no` | Next USAGENO |
| GET | `/get-machine-lines` | Available machine lines |
| GET | `/get-feed-types` | Feed types (item codes) |
| GET | `/get-variants-by-feed-type` | Variants for a feed type |
| GET | `/get-item-code` | Available item codes (QM3 / QM4D-tagged) |
| GET | `/get-allocation` | FIFO stock allocation for an item/weight |
| GET | `/get-batch-lists` | Dosing vs non-dosing batch lists + counts |
| GET | `/get-batch-details` | Items in a specific batch |
| GET | `/get-rm-total-kgs` | Total required KGS (dosing vs non-dosing) |
| GET | `/get-issuance-no` | Available issuance reference numbers |
| GET | `/get-allowed-reviewer` | Reviewers (fixed user set) |
| GET | `/get-next-batch-no` | Next batch number |

**Write:**
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/save-material-utilization` | Save header + base details (transType 1) or batching (transType 2) — SP `[2026.spProducationMaterialUtilizationSave]` |
| POST | `/save-batching-material-utilization` | Save batch details (transType 2) with allocation |
| PUT | `/update-batching-material-utilization` | Update batch details (transType 3) |
| POST | `/set-complete` | Mark utilization as done (IS_DONE=1) + set issuance/encoded/reviewed/remarks |

### Material Utilization Tag — `/production-dept/material-utilization-tag`
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/get-tag` | Get tag configuration |
| PUT | `/update-tag` | Update tag (IS_TAGGED_IN_QM4D) |

### Material Issuance (Production) — `/production-dept/material-issuance`
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/get-item-code` | Available raw material items |
| GET | `/get-next-mir-no` | Next MIR number |
| PUT | `/save-material-issuance-request` | Create MIR (transactional, emits socket event) |

### Material Issuance Request Review — `/production-dept/material-issuance-request-review`
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/get-review-lists` | MIR requests pending review |
| GET | `/get-mir-details` | Details for a specific MIR |

### Material Issuance Confirmation (Production) — `/production-dept/material-issuance-confirmation`
*(Note: This route prefix may differ; see `app.js` line 88 for actual registration)*

### Raw Materials Issuance Confirmation — `/raw-materials-dept/material-issuance-confirmation`
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/get-material-issuance-request-header` | Pending confirmation items |
| GET | `/get-materials-issuance-request-details/:mirNo` | MIR line details |
| POST | `/mark-item-as-preparing` | Set item to "preparing" state |
| POST | `/mark-item-as-prepared` | Set item to "prepared" state |
| POST | `/mark-item-as-served` | Set item to "served" state |
| POST | `/mark-item-as-confirmed` | Confirm item (moves notification to history) |
| POST | `/cancel-item` | Cancel an item |
| GET | `/get-preparing-items` | Items in "preparing" state |
| GET | `/get-prepared-items` | Items in "prepared" state |
| GET | `/get-served-items` | Items in "served" (unconfirmed) state |
| GET | `/get-confirmed-items-today` | Confirmed items for today |

### Forklift Operator — `/forklift-operators`
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` or `/get-forklift-operators` | List all operators |
| GET | `/get-operator/:id` | Get single operator |
| POST | `/create` | Create operator (transactional) |
| PUT | `/update/:id` | Update operator |
| DELETE | `/delete/:id` | Delete operator |

---

## Appendix: MVC Quick Reference

### Where to find each MVC component:

| Looking For? | Go To (Frontend) | Go To (Backend) |
|---|---|---|
| **Model (data shapes)** | `features/**/types/*.types.ts` | SQL in controllers/services + `schema/` endpoint |
| **View (UI screens)** | `features/**/*Screen.tsx`, `app/**/*.tsx` | N/A (returns JSON) |
| **View (sub-components)** | `features/**/components/*`, `components/*` | N/A |
| **Controller (API calls)** | `features/**/services/*.ts` | `server/src/modules/**/controllers/*.js` or `controller/*.js` |
| **Router (URL mapping)** | `app/**/*.tsx` (file-based) | `server/src/modules/**/routes/*.js` |
| **Service (business logic)** | Same as Controller (frontend) | `server/src/modules/**/services/*.js` (where present) |
| **Database config** | N/A on frontend | `server/src/config/database.js` |
| **Company→DB mapping** | N/A on frontend | `server/src/utils/companyDb.js` |
| **Auth state** | `features/auth/context/AuthContext.tsx` | `server/src/modules/auth/` |
| **Real-time events** | `features/shared/services/socketService.ts` | `server/src/socket.js`, `server/src/utils/socketEvents.js` |
