# SnapTrade Portfolio Tracker

A portfolio tracker app that aggregates multiple brokerage accounts using the SnapTrade API.  
Built with a Deno backend + Supabase + iOS (SwiftUI).

---

## Architecture Overview

```
iOS App (SwiftUI)
    │  JWT (Supabase Auth)
    ▼
Backend (Deno / ORPC)  ──→  SnapTrade API
    │
    ▼
Supabase (PostgreSQL + Auth)
```

- **iOS**: Signs in via Supabase Auth → passes JWT to the backend
- **Backend**: Validates JWT → calls SnapTrade API → caches results in Supabase
- **Supabase**: User authentication & cache DB (Row-Level Security ensures users can only access their own data)

---

## Setup

### Prerequisites

| Tool | Version |
|---|---|
| Deno | 2.x |
| Supabase CLI | latest |
| Xcode | 26.3+ |
| iOS Deployment Target | iOS 17+ |

---

### 1. Supabase

```bash
# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase

# Start local instance
supabase start

# Apply migrations
supabase db push
```

Retrieve the following from the Supabase dashboard:

| Value | Location |
|---|---|
| `SUPABASE_URL` | Project Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | Project Settings > API > anon/public |
| `SUPABASE_SECRET_KEY` | Project Settings > API > service_role |

---

### 2. Backend

```bash
cd backend

# Create .env file
cp .env.example .env  # or create manually
```

Add the following to `.env`:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...
SNAPTRADE_CLIENT_ID=your_client_id
SNAPTRADE_CONSUMER_KEY=your_consumer_key
```

```bash
# Start dev server (port 8000)
deno task dev
```

---

### 3. iOS

```bash
open ios/SnaptradePortfolioTracker/SnaptradePortfolioTracker.xcodeproj
```

Set your Supabase credentials in `SupabaseManager.swift`:

```swift
// ios/.../App/SupabaseManager.swift
let supabase = SupabaseClient(
    supabaseURL: URL(string: "https://xxxx.supabase.co")!,
    supabaseKey: "eyJ..."  // anon key
)
```

Then build and run on a simulator or device from Xcode.

---

## OpenAPI Client Generation

Swift client code for iOS is automatically generated from the backend's type definitions (Zod schemas).

### Generation Flow

```
backend/router.ts (ORPC + Zod)
    │
    │  deno task gen:openapi
    ▼
contract/openapi.json             ← source of truth (JSON)
ios/.../Resources/openapi.yaml   ← iOS copy (YAML)
    │
    │  Xcode build (swift-openapi-generator)
    ▼
Generated Swift client code
```

### Steps

```bash
cd backend

# Generate OpenAPI spec (updates both contract/ and ios/.../Resources/)
deno task gen:openapi
```

Building in Xcode then generates the Swift `Client` class and all response types from `openapi.yaml`.

### Notes

- `contract/openapi.json` is the single source of truth. `openapi.yaml` is a generated artifact — do not edit it manually.
- `openapi-generator-config.yaml` specifies `generate: [types, client]`, producing both type definitions and the client class.
- Zod v4 outputs nullable schemas as `anyOf: [T, null]`, which swift-openapi-generator does not support. The generation script automatically converts these to `type: [T, "null"]` (the OpenAPI 3.1 workaround).

---

## API Endpoints

Base URL: `http://localhost:8000/api`  
All endpoints require an `Authorization: Bearer <JWT>` header.

### Holdings

| Method | Path | Description |
|---|---|---|
| POST | `/holdings.getAll` | Returns positions, balances, and total portfolio value for a given account (from Supabase cache) |

**Request**: `{ accountId: string }`

---

### SnapTrade

| Method | Path | Description |
|---|---|---|
| POST | `/snaptrade.connect` | Returns a broker connection portal URL (registers a SnapTrade user on first call) |
| POST | `/snaptrade.accounts` | Returns connected brokerages and accounts from Supabase cache |
| POST | `/snaptrade.sync` | Fetches latest accounts, holdings, and transactions from SnapTrade and updates Supabase |
| POST | `/snaptrade.reconnect` | Returns a re-authentication portal URL for an existing connection |
| DELETE | `/snaptrade.deleteConnection` | Deletes a brokerage authorization and its associated data from Supabase |
| DELETE | `/snaptrade.deleteSnapTradeUser` | Permanently deletes the SnapTrade user and all related data |

---

### Transactions

| Method | Path | Description |
|---|---|---|
| POST | `/transactions.getAll` | Returns transaction history for a given account from Supabase cache (ordered by trade_date DESC) |

**Request**: `{ accountId: string }`

---

## SnapTrade Connection Flow

### Initial Connection

```
iOS                         Backend                     SnapTrade API
 │                             │                              │
 │  POST /snaptrade.connect    │                              │
 │────────────────────────────>│                              │
 │                             │  POST /snapTrade/registerUser│
 │                             │─────────────────────────────>│
 │                             │  ← { userId, userSecret }    │
 │                             │  (saves userSecret to        │
 │                             │   Supabase user_secrets)     │
 │                             │                              │
 │                             │  POST /snapTrade/login       │
 │                             │─────────────────────────────>│
 │                             │  ← { redirectURI }           │
 │  ← { redirectURI }          │                              │
 │                             │                              │
 │  Opens redirectURI in WebView                              │
 │──────────────────────────────────────────────────────────>│
 │              User authenticates with broker               │
 │<──────────────────────────────────────────────────────────│
 │  snaptrade://connected (deep link)                        │
 │                             │                              │
 │  POST /snaptrade.sync       │                              │
 │────────────────────────────>│                              │
 │                             │  Fetch accounts, holdings,   │
 │                             │  and transactions            │
 │                             │─────────────────────────────>│
 │                             │  Cache results in Supabase   │
 │  ← sync complete            │                              │
```

### Reconnection (when a connection expires)

```
iOS                         Backend                     SnapTrade API
 │                             │                              │
 │  POST /snaptrade.reconnect  │                              │
 │  { authorizationId }        │                              │
 │────────────────────────────>│                              │
 │                             │  POST /snapTrade/login       │
 │                             │  (with reconnect param)      │
 │                             │─────────────────────────────>│
 │                             │  ← { redirectURI }           │
 │  ← { redirectURI }          │                              │
 │  Re-authenticates in WebView│                              │
```

### Data Read Flow (via cache)

```
iOS                         Backend                  Supabase
 │                             │                        │
 │  POST /holdings.getAll      │                        │
 │  POST /transactions.getAll  │                        │
 │────────────────────────────>│                        │
 │                             │  SELECT from cache     │
 │                             │───────────────────────>│
 │                             │  ← rows                │
 │  ← { positions, balances }  │                        │
```

> **Note**: Only `/snaptrade.sync` talks directly to SnapTrade. All read endpoints serve data from the Supabase cache.

---

## Out of Scope

The following features are not currently implemented.

| Feature | Notes |
|---|---|
| **Webhook handling** | Real-time notifications from SnapTrade (e.g. account changes, expired connections) are not handled. Operations that should ideally wait for a webhook (e.g. `deleteSnapTradeUser`) are executed immediately as a workaround. |
| **Cron / scheduled sync** | Automatic periodic data sync is not implemented. Users must manually trigger a sync. |
| **Secrets encryption** | `snaptrade_user_secret` in the `user_secrets` table is stored as plaintext. Encryption via Supabase Vault is not yet implemented. |
