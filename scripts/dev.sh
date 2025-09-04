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
echo ""

# Just run turbo dev directly - let the user control it with Ctrl+C
# No signal trapping, no complex process management - keep it simple!
turbo run dev