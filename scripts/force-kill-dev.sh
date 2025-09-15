#!/bin/bash

# ColdTrace Force Kill Development Processes
# Emergency script for when normal cleanup doesn't work

set -e

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration (shared with cleanup-dev.sh)
readonly DEV_PIDS_FILE="/tmp/coldtrace-dev-pids"
readonly PORTS=(3000 3001 4000 4001 5555 8080)
readonly PROCESS_PATTERNS=(
    "setsid.*bash.*dev:setsid dev processes"
    "next.*dev:Next.js dev servers"
    "tsx.*watch:TSX watch processes"
    "tsc.*--watch:TypeScript watchers"
    "prisma.*studio:Prisma Studio"
    "turbo.*run.*dev:Turbo dev processes"
    "pnpm.*dev:PNPM dev processes"
    "ColdTrace.*node:ColdTrace Node processes"
)

echo -e "${RED}⚠️  FORCE KILLING ColdTrace Development Processes${NC}"
echo -e "${YELLOW}This is an emergency cleanup - use only when normal cleanup fails${NC}"

# Function to force kill by pattern
force_kill_pattern() {
    local pattern="$1"
    local description="$2"
    
    echo -e "${YELLOW}Force killing $description...${NC}"
    
    local pids
    pids=$(pgrep -f "$pattern" 2>/dev/null || true)
    
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
    
    local pid
    pid=$(lsof -ti:"$port" 2>/dev/null || true)
    
    if [ -n "$pid" ]; then
        echo "Port $port occupied by PID $pid"
        echo -e "${RED}Force killing PID $pid${NC}"
        kill -9 "$pid" 2>/dev/null || true
    else
        echo "Port $port is already free"
    fi
}

# Function to clean up stuck dev.sh processes
cleanup_stuck_dev_processes() {
    echo -e "\n${YELLOW}1. Killing stuck dev.sh processes...${NC}"
    
    if [ -f "$DEV_PIDS_FILE" ]; then
        local dev_pid
        dev_pid=$(cat "$DEV_PIDS_FILE" 2>/dev/null || true)
        
        if [ -n "$dev_pid" ] && kill -0 "$dev_pid" 2>/dev/null; then
            echo -e "${RED}Force killing dev.sh process (PID: $dev_pid)${NC}"
            kill -9 "$dev_pid" 2>/dev/null || true
        fi
        
        rm -f "$DEV_PIDS_FILE"
    fi
}

# Clean up stuck processes first
cleanup_stuck_dev_processes

# Force kill all development processes
echo -e "\n${YELLOW}2. Force killing all development processes...${NC}"
for pattern_desc in "${PROCESS_PATTERNS[@]}"; do
    IFS=':' read -r pattern description <<< "$pattern_desc"
    force_kill_pattern "$pattern" "$description"
done

# Force free all ports
echo -e "\n${YELLOW}3. Force freeing all ports...${NC}"
port_descriptions=("Frontend" "Frontend (alt)" "Backend GraphQL" "Backend (alt)" "Prisma Studio" "Adminer")
for i in "${!PORTS[@]}"; do
    force_kill_port "${PORTS[$i]}" "${port_descriptions[$i]}"
done

# Kill zombie processes and stop daemon
echo -e "\n${YELLOW}4. Killing zombie processes...${NC}"
pkill -9 -f '<defunct>' 2>/dev/null || true

echo -e "\n${YELLOW}5. Stopping Turbo daemon...${NC}"
npx turbo daemon stop 2>/dev/null || true

# 6. Nuclear option - kill all Node processes in the project (commented out for safety)
# echo -e "\n${RED}6. NUCLEAR: Killing all Node.js processes (DANGEROUS)...${NC}"
# read -p "Are you sure? This will kill ALL Node processes! (y/N): " -n 1 -r
# echo
# if [[ $REPLY =~ ^[Yy]$ ]]; then
#     pkill -9 node 2>/dev/null || true
# fi

# Function to verify force cleanup results
verify_force_cleanup() {
    echo -e "\n${GREEN}✅ Force cleanup completed!${NC}"
    
    # Check what's left
    echo -e "\n${BLUE}Checking remaining processes...${NC}"
    local remaining
    remaining=$(ps aux | grep -E "(tsx|next|turbo|pnpm)" | grep -v grep | grep -E "(ColdTrace|coldtrace)" || true)
    
    if [ -n "$remaining" ]; then
        echo -e "${YELLOW}Still running:${NC}"
        echo "$remaining"
        echo -e "${RED}⚠️  Some processes survived force cleanup!${NC}"
    else
        echo -e "${GREEN}No development processes remain${NC}"
    fi
    
    # Check ports
    echo -e "\n${BLUE}Checking ports...${NC}"
    local any_occupied=false
    
    for i in "${!PORTS[@]}"; do
        local port="${PORTS[$i]}"
        local desc="${port_descriptions[$i]}"
        
        if lsof -i:"$port" >/dev/null 2>&1; then
            echo -e "${YELLOW}Port $port ($desc) still occupied${NC}"
            any_occupied=true
        else
            echo -e "${GREEN}Port $port ($desc) is free${NC}"
        fi
    done
    
    echo -e "\n${GREEN}🎉 Emergency cleanup finished!${NC}"
    
    if [ "$any_occupied" = true ]; then
        echo -e "${YELLOW}⚠️  Some ports are still occupied. You may need to restart your system.${NC}"
    fi
    
    echo -e "${BLUE}💡 You should now be able to close terminals normally${NC}"
}

verify_force_cleanup