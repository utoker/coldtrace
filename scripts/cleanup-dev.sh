#!/bin/bash

# ColdTrace Development Process Cleanup Script
# This script terminates all development processes and frees up ports

set -e

echo "🧹 Starting ColdTrace development cleanup..."

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Configuration
readonly GRACEFUL_WAIT_TIME=1
readonly DEV_PIDS_FILE="/tmp/coldtrace-dev-pids"
readonly PORTS=(3000 3001 4000 4001 5555 8080)
readonly PROCESS_PATTERNS=(
    "next.*dev:Next.js dev servers"
    "tsx.*watch:TSX watch processes"
    "tsc.*--watch:TypeScript watchers"
    "prisma.*studio:Prisma Studio"
    "turbo.*run.*dev:Turbo dev processes"
    "pnpm.*dev:PNPM dev processes"
    "setsid.*bash.*dev:setsid dev processes"
)

# Function to kill processes gracefully with fallback to force kill
kill_process_gracefully() {
    local pid="$1"
    local description="$2"
    
    if kill -TERM "$pid" 2>/dev/null; then
        echo -e "${GREEN}Sent SIGTERM to PID $pid ($description)${NC}"
        sleep "$GRACEFUL_WAIT_TIME"
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}Force killing PID $pid${NC}"
            kill -9 "$pid" 2>/dev/null || true
        fi
    fi
}

# Function to kill processes by pattern
kill_by_pattern() {
    local pattern="$1"
    local description="$2"
    
    echo -e "${YELLOW}Killing $description...${NC}"
    
    local pids
    pids=$(pgrep -f "$pattern" 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        echo "Found PIDs: $pids"
        for pid in $pids; do
            kill_process_gracefully "$pid" "$description"
        done
    else
        echo "No $description processes found"
    fi
}

# Function to kill processes by port
kill_by_port() {
    local port="$1"
    local description="$2"
    
    echo -e "${YELLOW}Freeing port $port ($description)...${NC}"
    
    local pid
    pid=$(lsof -ti:"$port" 2>/dev/null || true)
    
    if [ -n "$pid" ]; then
        echo "Port $port is occupied by PID $pid"
        kill_process_gracefully "$pid" "port $port process"
    else
        echo "Port $port is free"
    fi
}

# Function to clean up stuck dev.sh processes
cleanup_dev_processes() {
    echo -e "${YELLOW}Cleaning up stuck dev.sh processes...${NC}"
    
    if [ -f "$DEV_PIDS_FILE" ]; then
        local dev_pid
        dev_pid=$(cat "$DEV_PIDS_FILE" 2>/dev/null || true)
        
        if [ -n "$dev_pid" ] && kill -0 "$dev_pid" 2>/dev/null; then
            echo "Found stuck dev.sh process (PID: $dev_pid)"
            kill_process_gracefully "$dev_pid" "dev.sh process"
        fi
        
        rm -f "$DEV_PIDS_FILE"
    fi
}

# Kill all development processes using configuration arrays
echo -e "${YELLOW}Killing development processes...${NC}"
for pattern_desc in "${PROCESS_PATTERNS[@]}"; do
    IFS=':' read -r pattern description <<< "$pattern_desc"
    kill_by_pattern "$pattern" "$description"
done

# Free up all development ports
echo -e "${YELLOW}Freeing development ports...${NC}"
port_descriptions=("Frontend" "Frontend (alt)" "Backend GraphQL" "Backend (alt)" "Prisma Studio" "Adminer")
for i in "${!PORTS[@]}"; do
    kill_by_port "${PORTS[$i]}" "${port_descriptions[$i]}"
done

# Clean up stuck processes and zombies
cleanup_dev_processes

echo -e "${YELLOW}Cleaning up zombie processes...${NC}"
pkill -9 -f '<defunct>' 2>/dev/null || true

echo -e "${YELLOW}Stopping Turbo daemon...${NC}"
npx turbo daemon stop 2>/dev/null || true

echo -e "${YELLOW}Cleaning up remaining ColdTrace processes...${NC}"
kill_by_pattern "/home/u/Projects/ColdTrace" "ColdTrace project processes"

# Function to verify cleanup results
verify_cleanup() {
    echo -e "${GREEN}Cleanup complete! Verifying results...${NC}"
    
    # Check for remaining processes
    local remaining_processes
    remaining_processes=$(ps aux | grep -E "(tsx|next|turbo|pnpm)" | grep -v grep | grep -E "(ColdTrace|coldtrace)" || true)
    
    if [ -n "$remaining_processes" ]; then
        echo -e "${RED}Warning: Some processes may still be running:${NC}"
        echo "$remaining_processes"
    else
        echo -e "${GREEN}✅ All development processes cleaned up successfully!${NC}"
    fi
    
    # Check ports
    echo -e "${YELLOW}Checking ports...${NC}"
    local all_ports_free=true
    
    for i in "${!PORTS[@]}"; do
        local port="${PORTS[$i]}"
        local desc="${port_descriptions[$i]}"
        
        if lsof -i:"$port" >/dev/null 2>&1; then
            echo -e "${RED}Port $port ($desc) is still occupied${NC}"
            lsof -i:"$port"
            all_ports_free=false
        else
            echo -e "${GREEN}Port $port ($desc) is free${NC}"
        fi
    done
    
    if [ "$all_ports_free" = true ]; then
        echo -e "${GREEN}🎉 Development environment cleanup finished successfully!${NC}"
    else
        echo -e "${YELLOW}⚠️  Some ports are still occupied. You may need to run force-kill-dev.sh${NC}"
    fi
}

# Wait a moment for cleanup then verify
sleep 2
verify_cleanup