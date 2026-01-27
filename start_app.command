#!/bin/bash

# Change directory to the folder containing this script
cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Try to load user environment variables
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -f ~/.zshrc ] && source ~/.zshrc 2>/dev/null
[ -f ~/.bash_profile ] && source ~/.bash_profile 2>/dev/null

echo -e "${BLUE}Starting CV-OS Coach...${NC}"
echo -e "Working Directory: $(pwd)"

# Check if Node.js is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed or not found.${NC}"
    echo -e "${YELLOW}This application requires Node.js to run.${NC}"
    echo -e "Opening download page..."
    sleep 2
    open "https://nodejs.org/en/download/"
    echo -e "${YELLOW}Please install Node.js, then run this file again.${NC}"
    read -p "Press Enter to close..."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}First time setup: Installing dependencies...${NC}"
    npm install
fi

# Start development server
echo -e "${GREEN}Starting server...${NC}"
npm run dev &
PID=$!

# Wait for server to start
echo -e "Waiting for Next.js to warm up..."
sleep 5

# Open browser
echo -e "${GREEN}Opening App in Browser...${NC}"
open "http://localhost:3000"

# Keep script running to keep server alive
wait $PID
