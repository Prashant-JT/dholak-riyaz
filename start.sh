#!/bin/bash

echo "🥁 Dholak Riyaz"
echo ""

# Load nvm if available
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use 2>/dev/null || nvm install
fi

# Initial TypeScript compile
echo "Compiling..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Compilation error"
    exit 1
fi

echo "✅ Compiled"
echo ""

# Kill any processes on port 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null

# Start watch compilation in the background
echo "🔄 Watch mode active"
npx tsc --watch &
TSC_PID=$!

echo "🌐 Server: http://localhost:8080"
echo "   Press Ctrl+C to stop"
echo ""

# Clean up processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $TSC_PID 2>/dev/null
    lsof -ti:8080 | xargs kill -9 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Serve with Python on port 8080
python3 -m http.server 8080

# Made with Bob
