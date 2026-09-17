#!/usr/bin/env bash
# PhishGuard Pro - System Launcher Script

set -e

PORT=${PORT:-5050}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "============================================================"
echo "      🛡️  PHISHGUARD PRO - AUTONOMOUS DETECTION ENGINE       "
echo "============================================================"
echo " [1] Launch Web Application (Production React + Python API) "
echo " [2] Launch Full Dev Environment (Vite + Python Backend)    "
echo " [3] Run Automated Test Suite (Unit & Regression Tests)     "
echo " [4] Run CLI Phishing Scanner                               "
echo " [5] Rebuild React Frontend (Vite build)                    "
echo "============================================================"

MODE=${1:-1}

if [ "$MODE" == "1" ]; then
    echo "[*] Checking frontend build..."
    if [ ! -d "frontend/dist" ]; then
        echo "[*] Building React frontend..."
        cd frontend && npm run build && cd ..
    fi
    echo "[*] Launching PhishGuard on http://127.0.0.1:$PORT..."
    echo "[*] Serving React Dashboard + REST API + SQLite Storage"
    echo "[*] Press Ctrl+C to terminate."
    python3 backend/app.py

elif [ "$MODE" == "2" ]; then
    echo "[*] Starting Python REST API on http://127.0.0.1:5050..."
    python3 backend/app.py &
    BACKEND_PID=$!
    echo "[*] Starting Vite React Dev Server on http://127.0.0.1:5173..."
    cd frontend && npm run dev &
    FRONTEND_PID=$!
    
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
    wait

elif [ "$MODE" == "3" ]; then
    echo "[*] Running PhishGuard Automated Test Suite..."
    python3 -m unittest discover -s backend/tests -p "test_*.py" -v

elif [ "$MODE" == "4" ]; then
    echo "[*] Launching PhishGuard CLI Scanner..."
    python3 backend/cli.py "$2"

elif [ "$MODE" == "5" ]; then
    echo "[*] Compiling React Vite distribution..."
    cd frontend && npm run build
    echo "[✓] Build complete in frontend/dist/"
else
    echo "Unknown option: $MODE"
    echo "Usage: ./run.sh [1|2|3|4|5]"
fi
