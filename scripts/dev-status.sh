#!/bin/bash

# ColdTrace Development Status Script
# Shows all running development processes and occupied ports

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 ColdTrace Development Environment Status${NC}"
echo "==============================================="

# Check running processes
echo -e "\n${YELLOW}🔄 Running Development Processes:${NC}"
processes=$(ps aux | grep -E "(tsx|next|turbo|pnpm)" | grep -v grep | grep -E "(ColdTrace|coldtrace)" || true)

if [ -n "$processes" ]; then
    echo "$processes" | while read line; do
        echo -e "${GREEN}  ✓ $line${NC}"
    done
else
    echo -e "${RED}  ❌ No development processes running${NC}"
fi

# Check ports
echo -e "\n${YELLOW}🔌 Port Status:${NC}"
ports=(3000 3001 4000 4001 5555 8080)
port_descriptions=("Frontend" "Frontend (alt)" "Backend GraphQL" "Backend (alt)" "Prisma Studio" "Adminer")

for i in "${!ports[@]}"; do
    port="${ports[$i]}"
    desc="${port_descriptions[$i]}"
    
    if lsof -i:$port >/dev/null 2>&1; then
        pid=$(lsof -ti:$port 2>/dev/null)
        process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        echo -e "${GREEN}  ✓ Port $port ($desc) - PID: $pid ($process_name)${NC}"
    else
        echo -e "${RED}  ❌ Port $port ($desc) - FREE${NC}"
    fi
done

# Check for zombie processes
echo -e "\n${YELLOW}🧟 Zombie Processes:${NC}"
zombies=$(ps aux | grep '<defunct>' | grep -v grep || true)
if [ -n "$zombies" ]; then
    echo "$zombies" | while read line; do
        echo -e "${RED}  ⚠️  $line${NC}"
    done
    echo -e "${YELLOW}  💡 Run 'pnpm cleanup' to remove zombie processes${NC}"
else
    echo -e "${GREEN}  ✓ No zombie processes found${NC}"
fi

# Quick actions
echo -e "\n${BLUE}🛠️  Quick Actions:${NC}"
echo -e "${GREEN}  pnpm dev           ${NC}→ Start development environment"
echo -e "${GREEN}  pnpm dev:stop      ${NC}→ Stop all development processes"
echo -e "${GREEN}  pnpm dev:force-kill${NC}→ Emergency force kill (if stuck)"
echo -e "${GREEN}  pnpm dev:status    ${NC}→ Show this status"
echo -e "${GREEN}  pnpm cleanup       ${NC}→ Advanced cleanup with details"

echo -e "\n${YELLOW}💡 Development Tips:${NC}"
echo -e "${GREEN}  • Ctrl+C now works perfectly to stop dev processes!${NC}"
echo -e "${GREEN}  • Terminals close normally after Ctrl+C${NC}"
echo -e "${GREEN}  • Use pnpm dev:stop for manual cleanup if needed${NC}"
echo -e "${GREEN}  • For stuck processes: pnpm dev:force-kill${NC}"

echo ""