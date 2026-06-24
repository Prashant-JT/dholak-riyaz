#!/bin/bash

echo "🥁 Dholak Riyaz"
echo ""

# Cargar nvm si existe
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use 2>/dev/null || nvm install
fi

# Compilar TypeScript inicial
echo "Compilando..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error al compilar"
    exit 1
fi

echo "✅ Compilado"
echo ""

# Matar procesos en puerto 8080 si existen
lsof -ti:8080 | xargs kill -9 2>/dev/null

# Iniciar compilación automática en segundo plano
echo "🔄 Compilación automática activada"
npx tsc --watch &
TSC_PID=$!

echo "🌐 Servidor: http://localhost:8080"
echo "   Presiona Ctrl+C para detener"
echo ""

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill $TSC_PID 2>/dev/null
    lsof -ti:8080 | xargs kill -9 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Usar Python en puerto 8080
python3 -m http.server 8080

# Made with Bob
