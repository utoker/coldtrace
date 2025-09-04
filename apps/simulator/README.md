# ColdTrace Vaccine Simulator

A production-ready GraphQL-connected simulator for vaccine cold chain monitoring with interactive demo controls.

## Features

- 🌡️  **Vaccine-focused temperature simulation** (2-8°C range with realistic excursions)
- 📡 **GraphQL integration** with Apollo Client and retry logic  
- 🎮 **Interactive demo controls** for presentations and testing
- 📊 **Real-time statistics** and enhanced logging
- 🔋 **Battery simulation** and device status monitoring
- ⚡ **Demo scenarios** (power outages, batch arrivals, temperature excursions)

## Quick Start

1. **Validate setup**:
   ```bash
   pnpm validate
   ```

2. **Start simulator for interactive demos**:
   
   **From project root directory**:
   ```bash
   pnpm simulator:demo
   ```
   
   **From simulator directory** (`cd apps/simulator`):
   ```bash
   pnpm dev:demo
   ```

3. **Run verification test**:
   
   **From project root**:
   ```bash
   pnpm simulator:test
   ```
   
   **From simulator directory**:
   ```bash
   pnpm test
   ```

## ⚠️ Important: Interactive Controls

**For keyboard controls to work properly, use one of these commands:**

- `pnpm dev:demo` - TypeScript mode with full keyboard support
- `pnpm dev:interactive` - Same as above (alias)  
- `pnpm start` - Production mode (requires `pnpm build` first)

**Avoid `pnpm dev` for demos** - the watch mode can interfere with stdin/keyboard input.

## Interactive Demo Controls

Once running, use these keyboard controls:

- **`e` + Enter**: Trigger temperature excursion (spikes to 12°C)
- **`b` + Enter**: Simulate low battery on random device
- **`o` + Enter**: Take random device offline  
- **`p` + Enter**: Power outage simulation (all devices offline)
- **`a` + Enter**: Batch arrival (3 devices come online)
- **`r` + Enter**: Reset all devices to normal
- **`s` + Enter**: Show current statistics
- **`h` + Enter**: Show help
- **`q` + Enter**: Quit gracefully
- **`Ctrl+C`**: Emergency stop

## Scripts

### From Project Root (`~/Projects/ColdTrace`):
- `pnpm simulator:demo` - **🎮 Interactive demo mode** (recommended for presentations)
- `pnpm simulator:dev` - Development mode with hot reload
- `pnpm simulator:start` - Production mode (requires build first)
- `pnpm simulator:test` - Run comprehensive verification test
- `pnpm simulator:validate` - Validate setup and imports

### From Simulator Directory (`apps/simulator`):
- `pnpm dev:demo` - **🎮 Interactive demo mode** (recommended for presentations)
- `pnpm dev:interactive` - Alias for demo mode with full keyboard support
- `pnpm dev` - Development mode with hot reload (keyboard controls may not work)
- `pnpm start` - Production mode (requires `pnpm build` first)
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm test` - Run comprehensive verification test
- `pnpm test:quick` - Quick 30-second test with timeout
- `pnpm verify` - Alias for `pnpm test`
- `pnpm validate` - Validate setup and imports (no backend required)

## Verification Testing

The test suite validates:

- ✅ Database connection and GraphQL connectivity
- ✅ Device loading from backend  
- ✅ Reading creation and frequency (every 5 seconds)
- ✅ Temperature range validation (2-8°C with excursions)
- ✅ Device activity monitoring
- ✅ Success rate tracking

**Example test run**:
```bash
🧪 ColdTrace Simulator Verification Test
==========================================
✅ PASS Database Connection: Connected successfully, found 10 devices
✅ PASS Readings Created: Created 28 readings (expected at least 24)  
✅ PASS Temperature Ranges: 78.6% in vaccine range (2-8°C)
✅ PASS Device Activity: 10/10 devices active (100.0%)
✅ PASS Reading Frequency: 89.5% within 5±1 second intervals
```

## Environment Setup

Requires `.env` file with:
```
GRAPHQL_ENDPOINT=http://localhost:4000/graphql
DATABASE_URL="postgresql://user:pass@localhost:5432/coldtrace"
```

## Dependencies

- **Apollo Client 4.x** - GraphQL client with TypeScript support
- **Prisma** - Database ORM for reading validation  
- **Chalk** - Colorized console output
- **tsx** - TypeScript execution for development
- **readline** - Interactive keyboard controls

## Integration

Designed to work with:
- ColdTrace GraphQL backend (`/apps/backend`)
- PostgreSQL database with Prisma ORM (`/packages/database`)
- Seeded vaccine monitoring devices

## Production Ready

- Comprehensive error handling with exponential backoff retry
- Graceful shutdown on signals (SIGINT/SIGTERM)  
- Statistics tracking and periodic logging
- TypeScript compilation and build process
- Automated verification testing before deployment