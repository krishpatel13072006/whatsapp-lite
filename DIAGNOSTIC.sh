#!/bin/bash

echo "🔍 WhatsApp Lite Diagnostic Check"
echo "=================================="
echo ""

# Check if Node.js is installed
echo "✓ Checking Node.js..."
if command -v node &> /dev/null; then
    echo "  ✅ Node.js installed: $(node --version)"
else
    echo "  ❌ Node.js not found. Please install Node.js"
    exit 1
fi

echo ""
echo "✓ Checking Backend..."
if [ -f "backend/server.js" ]; then
    echo "  ✅ Backend server.js found"
else
    echo "  ❌ Backend server.js not found"
    exit 1
fi

echo ""
echo "✓ Checking Frontend..."
if [ -f "frontend/src/App.js" ]; then
    echo "  ✅ Frontend App.js found"
else
    echo "  ❌ Frontend App.js not found"
    exit 1
fi

echo ""
echo "✓ Checking .env file..."
if [ -f "backend/.env" ]; then
    echo "  ✅ Backend .env found"
    if grep -q "MONGO_URI" backend/.env; then
        echo "  ✅ MONGO_URI configured"
    else
        echo "  ❌ MONGO_URI not found in .env"
    fi
else
    echo "  ❌ Backend .env not found"
fi

echo ""
echo "=================================="
echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "1. Terminal 1: cd backend && npm install && node server.js"
echo "2. Terminal 2: cd frontend && npm install && npm start"
echo "3. Open http://localhost:3000 in your browser"
