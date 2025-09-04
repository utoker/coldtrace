#!/bin/bash

# ColdTrace Force Kill Development Processes
# Emergency script for when normal cleanup doesn't work

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  FORCE KILLING ColdTrace Development Processes${NC}"
echo -e "${YELLOW}This is an emergency cleanup - use only when normal cleanup fails${NC}"

# Function to force kill by pattern
force_kill_pattern() {
    local pattern="$1"
    local description="$2"
    
    echo -e "${YELLOW}Force killing $description...${NC}"
    
    local pids=$(pgrep -f "$pattern" 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        echo "Found PIDs: $pids"
        for pid in $pids; do
            echo -e "${RED}Force killing PID $pid${NC}"
            kill -9 "$pid" 2>/dev/null || true
        done
    else
        echo "No $description processes found"
    fi
}

# Function to force kill by port
force_kill_port() {
    local port="$1"
    local description="$2"
    
    echo -e "${YELLOW}Force freeing port $port ($description)...${NC}"
    
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo "Port $port occupied by PID $pid"
        echo -e "${RED}Force killing PID $pid${NC}"
        kill -9 "$pid" 2>/dev/null || true
    else
        echo "Port $port is already free"
    fi
}

# 1. Kill any stuck dev.sh processes
echo -e "\n${YELLOW}1. Killing stuck dev.sh processes...${NC}"
if [ -f "/tmp/coldtrace-dev-pids" ]; then
    dev_pid=$(cat "/tmp/coldtrace-dev-pids" 2>/dev/null || true)
    if [ -n "$dev_pid" ] && kill -0 "$dev_pid" 2>/dev/null; then
        echo -e "${RED}Force killing dev.sh process (PID: $dev_pid)${NC}"
        kill -9 "$dev_pid" 2>/dev/null || true
    fi
    rm -f "/tmp/coldtrace-dev-pids"
fi

# 2. Force kill all related processes
echo -e "\n${YELLOW}2. Force killing all development processes...${NC}"
force_kill_pattern "setsid.*bash.*dev" "setsid dev processes"
force_kill_pattern "next.*dev" "Next.js dev servers"
force_kill_pattern "tsx.*watch" "TSX watch processes"  
force_kill_pattern "tsc.*--watch" "TypeScript watchers"
force_kill_pattern "prisma.*studio" "Prisma Studio"
force_kill_pattern "turbo.*run.*dev" "Turbo dev processes"
force_kill_pattern "pnpm.*dev" "PNPM dev processes"
force_kill_pattern "ColdTrace.*node" "ColdTrace Node processes"

# 3. Force free all ports
echo -e "\n${YELLOW}3. Force freeing all ports...${NC}"
force_kill_port 3000 "Frontend"
force_kill_port 3001 "Frontend (alt)" 
force_kill_port 4000 "Backend GraphQL"
force_kill_port 4001 "Backend (alt)"
force_kill_port 5555 "Prisma Studio"
force_kill_port 8080 "Adminer"

# 4. Kill zombie processes
echo -e "\n${YELLOW}4. Killing zombie processes...${NC}"
pkill -9 -f '<defunct>' 2>/dev/null || true

# 5. Stop Turbo daemon
echo -e "\n${YELLOW}5. Stopping Turbo daemon...${NC}"
npx turbo daemon stop 2>/dev/null || true

# 6. Nuclear option - kill all Node processes in the project (commented out for safety)
# echo -e "\n${RED}6. NUCLEAR: Killing all Node.js processes (DANGEROUS)...${NC}"
# read -p "Are you sure? This will kill ALL Node processes! (y/N): " -n 1 -r
# echo
# if [[ $REPLY =~ ^[Yy]$ ]]; then
#     pkill -9 node 2>/dev/null || true
# fi

echo -e "\n${GREEN}✅ Force cleanup completed!${NC}"

# Check what's left
echo -e "\n${BLUE}Checking remaining processes...${NC}"
remaining=$(ps aux | grep -E "(tsx|next|turbo|pnpm)" | grep -v grep | grep -E "(ColdTrace|coldtrace)" || true)
if [ -n "$remaining" ]; then
    echo -e "${YELLOW}Still running:${NC}"
    echo "$remaining"
else
    echo -e "${GREEN}No development processes remain${NC}"
fi

# Check ports
echo -e "\n${BLUE}Checking ports...${NC}"
for port in 3000 3001 4000 4001 5555 8080; do
    if lsof -i:$port >/dev/null 2>&1; then
        echo -e "${YELLOW}Port $port still occupied${NC}"
    else
        echo -e "${GREEN}Port $port is free${NC}"
    fi
done

echo -e "\n${GREEN}🎉 Emergency cleanup finished!${NC}"
echo -e "${BLUE}💡 You should now be able to close terminals normally${NC}"