# ColdTrace

> Real-time vaccine cold chain monitoring platform with live IoT sensor simulation

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)
[![Apollo GraphQL](https://img.shields.io/badge/Apollo-GraphQL-311C87.svg)](https://www.apollographql.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎯 Project Overview

ColdTrace is a full-stack cold chain monitoring platform designed to track vaccine storage conditions in real-time. The system simulates IoT temperature sensors deployed across multiple locations, monitors temperature excursions, battery levels, and device connectivity, and provides a comprehensive dashboard for cold chain managers.

**Live Demo:** [View Dashboard](https://coldtrace.app) 
### Key Features

- 📊 **Real-time Dashboard** - Live temperature monitoring with interactive maps and device status cards
- 🌡️ **Temperature Monitoring** - Tracks vaccine storage conditions (2-8°C) with automatic excursion detection
- 🚨 **Alert System** - Real-time notifications for temperature excursions, low battery, and offline devices
- 🎮 **Interactive Simulator** - Control IoT sensor behavior with power outages, batch arrivals, and temperature excursions
- 🗺️ **Geographic Tracking** - Interactive Leaflet map showing device locations and real-time status
- 📈 **Analytics Dashboard** - Historical trends, compliance rates, and device statistics
- 🔄 **Real-time Updates** - GraphQL subscriptions for instant data synchronization
- 🏗️ **Monorepo Architecture** - Scalable Turborepo structure with shared packages

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ColdTrace System                         │
└─────────────────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼────────┐      ┌──────────▼───────────┐   ┌─────────▼────────┐
│   Frontend     │      │      Backend         │   │    Simulator     │
│   Next.js 15   │◄────►│   Apollo GraphQL     │◄──┤   Node.js CLI    │
│   React 19     │      │   WebSocket Subs     │   │   IoT Emulator   │
│   Port: 3000   │      │   Port: 4000         │   │   Interactive    │
└────────────────┘      └──────────┬───────────┘   └──────────────────┘
                                   │
                        ┌──────────▼───────────┐
                        │   PostgreSQL 17      │
                        │   Prisma ORM         │
                        │   Port: 5432         │
                        └──────────────────────┘
```

### Tech Stack

#### Frontend

- **Framework:** Next.js 15 (App Router), React 19
- **Styling:** Tailwind CSS, shadcn/ui components
- **State Management:** Zustand
- **Data Fetching:** Apollo Client with GraphQL subscriptions
- **Maps:** React Leaflet
- **Charts:** Recharts
- **UI Components:** Radix UI primitives

#### Backend

- **Server:** Node.js with Express 5
- **API:** Apollo Server (GraphQL)
- **Real-time:** GraphQL Subscriptions (WebSocket)
- **Database:** PostgreSQL 17 + Prisma ORM
- **Type Safety:** GraphQL Code Generator

#### Simulator

- **Runtime:** Node.js with TypeScript
- **GraphQL Client:** Apollo Client
- **Interactive Controls:** Node.js readline
- **Logging:** Chalk for colorized output

#### Infrastructure

- **Monorepo:** Turborepo with pnpm workspaces
- **Containerization:** Docker + Docker Compose
- **Database Admin:** Adminer
- **Type Checking:** TypeScript 5.7 across all packages
- **Linting:** ESLint with TypeScript rules
- **Testing:** Vitest

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm** 10.15.1 or later
- **Docker** and Docker Compose
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/utoker/coldtrace.git
   cd coldtrace
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start Docker services** (PostgreSQL + Adminer)

   ```bash
   pnpm docker:up
   ```

4. **Set up the database**

   ```bash
   pnpm db:setup
   ```

   This will run Prisma migrations and seed the database with sample devices.

5. **Start all development servers**

   ```bash
   pnpm dev
   ```

6. **Access the application**
   - 🌐 **Frontend:** http://localhost:3000
   - 🔌 **GraphQL Playground:** http://localhost:4000/graphql
   - 🗄️ **Database Admin (Adminer):** http://localhost:8080

### Optional: Run the Simulator

The simulator generates realistic IoT sensor data and supports interactive demo controls.

```bash
# From project root
pnpm simulator:demo

# Interactive controls:
# e - Trigger temperature excursion
# b - Simulate low battery
# o - Take device offline
# p - Power outage (all devices)
# a - Batch arrival (3 devices online)
# r - Reset all devices to normal
# s - Show statistics
# q - Quit
```

## 📁 Project Structure

```
ColdTrace/
├── apps/
│   ├── frontend/          # Next.js 15 dashboard
│   │   ├── src/
│   │   │   ├── app/       # App Router pages
│   │   │   ├── components/ # React components (46 files)
│   │   │   ├── contexts/  # React contexts
│   │   │   ├── graphql/   # GraphQL queries/mutations
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   ├── lib/       # Apollo client, utilities
│   │   │   └── store/     # Zustand stores
│   │   └── package.json
│   │
│   ├── backend/           # Apollo GraphQL server
│   │   ├── src/
│   │   │   ├── graphql/   # Schema, resolvers, context
│   │   │   ├── services/  # Alert and simulator services
│   │   │   └── lib/       # PubSub for subscriptions
│   │   └── package.json
│   │
│   └── simulator/         # IoT sensor simulator
│       ├── src/
│       │   ├── index.ts   # Main simulator logic
│       │   ├── test.ts    # Verification tests
│       │   └── validate.ts # Setup validation
│       └── package.json
│
├── packages/              # Shared packages
│   ├── database/          # Prisma schema and client
│   │   ├── schema.prisma  # Database models
│   │   └── src/
│   ├── types/             # Shared TypeScript types
│   ├── env/               # Environment variable validation
│   ├── logger/            # Logging utilities
│   └── tsconfig/          # Shared TypeScript configs
│
├── scripts/               # Development scripts
├── docker-compose.yml     # PostgreSQL + Adminer
├── turbo.json             # Turborepo configuration
├── pnpm-workspace.yaml    # pnpm workspace config
└── README.md              # This file
```

## 🎮 Development

### Available Scripts

#### Root Level Commands

```bash
pnpm dev                    # Start all dev servers (frontend, backend)
pnpm build                  # Build all apps and packages
pnpm lint                   # Run ESLint across workspace
pnpm test                   # Run all tests
pnpm clean                  # Clean all build outputs

# Docker Management
pnpm docker:up              # Start PostgreSQL and Adminer
pnpm docker:down            # Stop Docker containers
pnpm docker:reset           # Reset containers and volumes
pnpm docker:logs            # View container logs
pnpm docker:db              # Connect to PostgreSQL CLI

# Database Operations
pnpm db:setup               # Initialize database with schema and seed data
pnpm db:reset               # Reset database (drop + recreate + seed)

# Simulator Controls
pnpm simulator:demo         # Interactive simulator with keyboard controls
pnpm simulator:dev          # Run simulator in development mode
pnpm simulator:test         # Run simulator verification tests
pnpm simulator:validate     # Validate simulator setup
```

#### Frontend Development

```bash
cd apps/frontend
pnpm dev                    # Start Next.js dev server (localhost:3000)
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm lint                   # Run ESLint
```

#### Backend Development

```bash
cd apps/backend
pnpm dev                    # Start with tsx watch (localhost:4000)
pnpm build                  # Compile TypeScript
pnpm start                  # Run production build
pnpm generate               # Generate GraphQL types
pnpm test                   # Run Vitest tests
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://coldtrace:password@localhost:5432/coldtrace"

# Backend
PORT=4000
ALLOWED_ORIGINS="http://localhost:3000"

# Frontend (Next.js)
NEXT_PUBLIC_GRAPHQL_ENDPOINT="http://localhost:4000/graphql"
NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT="ws://localhost:4000/graphql"

# Simulator
GRAPHQL_ENDPOINT="http://localhost:4000/graphql"
SIM_INTERVAL_MINUTES=5
```

### Database Management

**Access Adminer** (GUI database tool):

```bash
# Start Adminer
pnpm docker:up

# Open http://localhost:8080
# Server: postgres
# Username: coldtrace
# Password: password
# Database: coldtrace
```

**Prisma Commands**:

```bash
cd packages/database

# Generate Prisma Client
pnpm generate

# Create migration
pnpm migrate:dev

# Apply migrations
pnpm migrate:deploy

# Open Prisma Studio
pnpm studio

# Seed database
pnpm seed
```

## 🧪 Testing

### Backend Tests

```bash
cd apps/backend
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode
```

### Simulator Verification

```bash
pnpm simulator:test         # Comprehensive verification test
```

The test suite validates:

- ✅ Database connectivity
- ✅ GraphQL endpoint health
- ✅ Device loading from backend
- ✅ Reading creation frequency (every 5 seconds)
- ✅ Temperature range validation (2-8°C for vaccines)
- ✅ Device activity monitoring
- ✅ Success rate tracking

## 📊 Features Deep Dive

### Real-time Dashboard

The frontend provides a comprehensive monitoring interface:

- **Map View**: Interactive Leaflet map with device markers color-coded by status
- **Device Grid**: Live cards showing temperature, battery, and connectivity status
- **Alert System**: Real-time toast notifications for critical events
- **Analytics Page**: Historical trends, compliance rates, and statistical analysis
- **Settings Page**: Device configuration and alert preferences

### GraphQL API

**Queries:**

- `getDevices` - Fetch devices with filtering (status, location, active)
- `getDeviceReadings` - Time-series temperature data
- `getDeviceStats` - Temperature statistics and compliance rates
- `getAlerts` - Alert history with filtering

**Mutations:**

- `createDevice`, `updateDevice` - Device management
- `createReading` - Submit new temperature reading
- `triggerExcursion`, `simulatePowerOutage`, etc. - Simulator controls
- `markAlertAsRead`, `resolveAlert` - Alert management

**Subscriptions:**

- `temperatureUpdates` - Real-time temperature readings
- `deviceStatusChanged` - Device connectivity changes
- `alertCreated` - Instant alert notifications

### Simulator Interactive Controls

The simulator supports keyboard-driven scenario testing:

| Key | Action                | Description               |
| --- | --------------------- | ------------------------- |
| `e` | Temperature Excursion | Spike to 12°C (critical)  |
| `b` | Low Battery           | Random device below 20%   |
| `o` | Take Offline          | Random device disconnects |
| `p` | Power Outage          | All devices go offline    |
| `a` | Batch Arrival         | 3 devices come online     |
| `r` | Reset                 | Return all to normal      |
| `s` | Statistics            | Show runtime stats        |
| `q` | Quit                  | Graceful shutdown         |

### Alert System

Automatic alerts are generated for:

- 🌡️ **Temperature Excursions** (outside 2-8°C range)
- 🔋 **Low Battery** (below 20%)
- 📡 **Device Offline** (connectivity lost)
- ⚠️ **Connection Lost** (no readings for 2+ minutes)

Alerts support:

- Severity levels (WARNING, CRITICAL)
- Read/unread status
- Resolution tracking
- Real-time notifications via GraphQL subscriptions

## 🏗️ Monorepo Structure

This project uses **Turborepo** with **pnpm workspaces** for efficient monorepo management.

**Benefits:**

- Shared dependencies and type definitions
- Incremental builds with caching
- Parallel task execution
- Consistent TypeScript configuration
- Reusable packages across apps

**Shared Packages:**

- `@coldtrace/database` - Prisma client and database utilities
- `@coldtrace/types` - Shared TypeScript interfaces
- `@coldtrace/env` - Environment variable validation
- `@coldtrace/logger` - Logging utilities
- `@coldtrace/tsconfig` - Shared TypeScript configurations

## 🚢 Deployment

### Production Architecture

**Recommended Stack:**

- **Frontend**: Vercel (Next.js optimized)
- **Backend**: Railway or Render (Node.js GraphQL server)
- **Database**: Supabase or Railway (PostgreSQL)
- **Simulator**: Railway Cron Job or Worker

### Environment Setup

**Vercel (Frontend)**:

```bash
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://your-backend.railway.app/graphql
NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT=wss://your-backend.railway.app/graphql
```

**Railway/Render (Backend)**:

```bash
DATABASE_URL=<your-postgresql-connection-string>
ALLOWED_ORIGINS=https://your-app.vercel.app,https://yourdomain.com
PORT=4000
```

**Railway Cron (Simulator)**:

```bash
GRAPHQL_ENDPOINT=https://your-backend.railway.app/graphql
SIM_INTERVAL_MINUTES=120
SIM_RUN_ONCE=true
```

### Build Commands

```bash
# Frontend
cd apps/frontend && pnpm install && pnpm build

# Backend
cd apps/backend && pnpm install && pnpm build

# Simulator
cd apps/simulator && pnpm install && pnpm build
```

## 🎨 Screenshots

_(Add screenshots here when deployed)_

**Dashboard View:**
![Dashboard](./docs/screenshots/dashboard.png)

**Map View with Devices:**
![Map View](./docs/screenshots/map.png)

**Analytics Page:**
![Analytics](./docs/screenshots/analytics.png)

**Alert System:**
![Alerts](./docs/screenshots/alerts.png)

## 🛠️ Technical Highlights

### Type Safety

- **End-to-end TypeScript** across frontend, backend, and simulator
- **GraphQL Code Generation** for type-safe queries and resolvers
- **Prisma** for type-safe database access
- **Zod** for runtime environment validation

### Real-time Features

- **GraphQL Subscriptions** via WebSocket (`graphql-ws`)
- **Apollo Server** with PubSub for event broadcasting
- **React hooks** for subscription management
- **Optimistic updates** for instant UI feedback

### Performance Optimizations

- **Turborepo caching** for faster builds
- **Prisma indexes** on frequently queried fields
- **Next.js App Router** with server components
- **Code splitting** and lazy loading

### Developer Experience

- **Hot reload** across all apps
- **Shared ESLint config** for code consistency
- **Automated database seeding**
- **Docker Compose** for local development
- **Interactive simulator** for demo presentations

## 📝 API Documentation

### GraphQL Playground

When running locally, access the GraphQL Playground at:

```
http://localhost:4000/graphql
```

**Example Query:**

```graphql
query GetDevices {
  getDevices(status: ONLINE, limit: 10) {
    id
    name
    location
    battery
    status
    latestReading {
      temperature
      timestamp
    }
  }
}
```

**Example Mutation:**

```graphql
mutation TriggerExcursion {
  triggerExcursion(deviceId: "device_123") {
    success
    message
    affectedDevices {
      id
      name
    }
  }
}
```

**Example Subscription:**

```graphql
subscription OnTemperatureUpdate {
  temperatureUpdates {
    id
    temperature
    battery
    timestamp
    device {
      name
      location
    }
  }
}
```

## 🤝 Contributing

This is a portfolio project, but feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Umut Toker**

- Portfolio: [utoker.com](https://utoker.com)
- LinkedIn: [linkedin.com/in/utoker](https://linkedin.com/in/utoker)
- GitHub: [@utoker](https://github.com/utoker)

## 🙏 Acknowledgments

- **shadcn/ui** for beautiful React components
- **Apollo GraphQL** for the excellent GraphQL implementation
- **Vercel** for Next.js and deployment platform
- **Prisma** for the amazing database toolkit

## 📚 Additional Resources

- [Docker Setup Guide](./README-Docker.md) - Detailed Docker development setup
- [Simulator Documentation](./apps/simulator/README.md) - Simulator usage and controls
- [API Documentation](./docs/api.md) _(if available)_
- [Deployment Guide](./docs/deployment.md) _(if available)_

---

**Built with ❤️ for vaccine cold chain management**

_Made with TypeScript, Next.js, Apollo GraphQL, and Prisma_
