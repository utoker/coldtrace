#!/bin/bash

# ColdTrace Development Startup Script
# Simple, reliable script that allows Ctrl+C to work properly

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting ColdTrace development environment...${NC}"
echo -e "${GREEN}💡 Use Ctrl+C to stop all development processes${NC}"
echo -e "${GREEN}💡 Run 'pnpm dev:stop' for manual cleanup if needed${NC}"
echo -e "${YELLOW}💡 Note: Simulator will start automatically for real-time data${NC}"
echo ""

# Start turbo dev and simulator in parallel
# Run turbo dev in background and simulator in foreground for interactive controls
turbo run dev &
TURBO_PID=$!

# Give turbo a moment to start
sleep 3

# Start simulator with demo mode (interactive controls)
echo -e "${BLUE}🎮 Starting simulator with interactive controls...${NC}"
pnpm --filter @coldtrace/simulator dev:demo

# If simulator exits, also stop turbo
kill $TURBO_PID 2>/dev/null