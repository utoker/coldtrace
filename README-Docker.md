# ColdTrace Docker Development Setup

This guide explains how to set up ColdTrace for local development using Docker.

## Prerequisites

- Docker and Docker Compose installed
- pnpm package manager

## Quick Start

1. **Start Docker services:**
   ```bash
   pnpm docker:up
   ```

2. **Set up database:**
   ```bash
   pnpm db:setup
   ```

3. **Start development servers:**
   ```bash
   pnpm dev
   ```

## Docker Services

### PostgreSQL 17
- **Port:** 5432
- **Database:** coldtrace
- **Username:** coldtrace  
- **Password:** password
- **Health checks:** Enabled with auto-restart

### Adminer (Database Admin)
- **URL:** http://localhost:8080
- **Server:** postgres (use container name, not localhost)
- **Username:** coldtrace
- **Password:** password
- **Database:** coldtrace

## Available Scripts

### Docker Management
- `pnpm docker:up` - Start all Docker services
- `pnpm docker:down` - Stop Docker services
- `pnpm docker:reset` - Reset containers and volumes
- `pnpm docker:logs` - View container logs
- `pnpm docker:db` - Connect to PostgreSQL via CLI
- `pnpm docker:adminer` - Show Adminer connection info

### Database Operations
- `pnpm db:setup` - Start Docker + setup database
- `pnpm db:reset` - Reset Docker + database from scratch

## Environment Files

- `.env` - Default development environment (Docker)
- `.env.local` - Local Docker development settings
- `.env.production.example` - Production template

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Simulator     │
│   Next.js       │    │   Apollo        │    │   Node.js       │
│   Port: 3000    │    │   Port: 4000    │    │   CLI Tool      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Adminer       │
│   Port: 5432    │    │   Port: 8080    │
│   (Docker)      │    │   (Docker)      │
└─────────────────┘    └─────────────────┘
```

## Development Workflow

1. Start Docker services: `pnpm docker:up`
2. Initialize database: `pnpm db:setup` (first time only)
3. Start dev servers: `pnpm dev`
4. Access Adminer at http://localhost:8080 for database management
5. Frontend at http://localhost:3000
6. Backend GraphQL at http://localhost:4000

## Troubleshooting

### Database Connection Issues
- Ensure Docker is running: `docker ps`
- Check container health: `docker compose ps`
- View logs: `pnpm docker:logs`

### Reset Everything
```bash
pnpm docker:down
docker system prune -f
pnpm db:reset
```

### Port Conflicts
If ports 5432 or 8080 are in use, update `docker-compose.yml`:
```yaml
ports:
  - "15432:5432"  # Use different host port
  - "18080:8080"  # Use different host port
```

## Production Deployment

For production, copy `.env.production.example` to `.env.production` and update with your production database URL (Supabase, AWS RDS, etc.).