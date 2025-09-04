#!/bin/bash

# ColdTrace Development Process Cleanup Script
# This script terminates all development processes and frees up ports

set -e

echo "🧹 Starting ColdTrace development cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill processes by pattern
kill_by_pattern() {
    local pattern="$1"
    local description="$2"
    
    echo -e "${YELLOW}Killing $description...${NC}"
    
    # Find PIDs matching the pattern
    local pids=$(pgrep -f "$pattern" 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        echo "Found PIDs: $pids"
        for pid in $pids; do
            if kill -TERM "$pid" 2>/dev/null; then
                echo -e "${GREEN}Sent SIGTERM to PID $pid${NC}"
                # Wait a bit for graceful shutdown
                sleep 1
                # Force kill if still running
                if kill -0 "$pid" 2>/dev/null; then
                    echo -e "${YELLOW}Force killing PID $pid${NC}"
                    kill -9 "$pid" 2>/dev/null || true
                fi
            fi
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
    
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo "Port $port is occupied by PID $pid"
        if kill -TERM "$pid" 2>/dev/null; then
            echo -e "${GREEN}Sent SIGTERM to PID $pid on port $port${NC}"
            sleep 1
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${YELLOW}Force killing PID $pid${NC}"
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
    else
        echo "Port $port is free"
    fi
}

# 1. Kill Next.js development servers
kill_by_pattern "next.*dev" "Next.js dev servers"

# 2. Kill TSX watch processes (backend)
kill_by_pattern "tsx.*watch" "TSX watch processes"

# 3. Kill TypeScript watchers
kill_by_pattern "tsc.*--watch" "TypeScript watchers"

# 4. Kill Prisma Studio
kill_by_pattern "prisma.*studio" "Prisma Studio"

# 5. Kill Turbo processes
kill_by_pattern "turbo.*run.*dev" "Turbo dev processes"

# 6. Kill pnpm dev processes
kill_by_pattern "pnpm.*dev" "PNPM dev processes"

# 7. Kill by common development ports
kill_by_port 3000 "Frontend"
kill_by_port 3001 "Frontend (alt)"
kill_by_port 4000 "Backend GraphQL"
kill_by_port 4001 "Backend (alt)"
kill_by_port 5555 "Prisma Studio"
kill_by_port 8080 "Adminer"

# 8. Clean up any stuck dev.sh processes
echo -e "${YELLOW}Cleaning up stuck dev.sh processes...${NC}"
if [ -f "/tmp/coldtrace-dev-pids" ]; then
    dev_pid=$(cat "/tmp/coldtrace-dev-pids" 2>/dev/null || true)
    if [ -n "$dev_pid" ] && kill -0 "$dev_pid" 2>/dev/null; then
        echo "Found stuck dev.sh process (PID: $dev_pid)"
        kill -TERM "$dev_pid" 2>/dev/null || true
        sleep 1
        if kill -0 "$dev_pid" 2>/dev/null; then
            echo "Force killing dev.sh process"
            kill -9 "$dev_pid" 2>/dev/null || true
        fi
    fi
    rm -f "/tmp/coldtrace-dev-pids"
fi

kill_by_pattern "setsid.*bash.*dev" "setsid dev processes"

# 9. Clean up zombie processes
echo -e "${YELLOW}Cleaning up zombie processes...${NC}"
pkill -9 -f '<defunct>' 2>/dev/null || true

# 9. Stop Turbo daemon if running
echo -e "${YELLOW}Stopping Turbo daemon...${NC}"
npx turbo daemon stop 2>/dev/null || true

# 10. Clean up any remaining node processes from the project
echo -e "${YELLOW}Cleaning up remaining ColdTrace processes...${NC}"
kill_by_pattern "/home/u/Projects/ColdTrace" "ColdTrace project processes"

# Wait a moment for cleanup
sleep 2

# Verify cleanup
echo -e "${GREEN}Cleanup complete! Checking remaining processes...${NC}"

remaining_processes=$(ps aux | grep -E "(tsx|next|turbo|pnpm)" | grep -v grep | grep -E "(ColdTrace|coldtrace)" || true)
if [ -n "$remaining_processes" ]; then
    echo -e "${RED}Warning: Some processes may still be running:${NC}"
    echo "$remaining_processes"
else
    echo -e "${GREEN}✅ All development processes cleaned up successfully!${NC}"
fi

# Check ports
echo -e "${YELLOW}Checking ports...${NC}"
for port in 3000 3001 4000 4001 5555 8080; do
    if lsof -i:$port >/dev/null 2>&1; then
        echo -e "${RED}Port $port is still occupied${NC}"
        lsof -i:$port
    else
        echo -e "${GREEN}Port $port is free${NC}"
    fi
done

echo -e "${GREEN}🎉 Development environment cleanup finished!${NC}"