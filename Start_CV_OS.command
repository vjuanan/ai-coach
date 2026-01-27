#!/bin/bash

# Navigate to project directory (handling spaces and emoji correctly)
cd "/Users/juanan/Library/CloudStorage/OneDrive-EPNStore/Team Ventas y Administracion 🤑/AI Deveolpments/AI Coach"

# Check if port 3000 is occupied and kill it if necessary (Clean Start)
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "🚀 Iniciando CV-OS Coach..."
echo "-----------------------------------"
echo "El servidor se está iniciando. La ventana del navegador se abrirá automáticamente en unos segundos."
echo "No cierres esta ventana mientras uses la aplicación."
echo "-----------------------------------"

# Open browser after a slight delay to allow server to spin up
(sleep 3 && open "http://localhost:3000") &

# Start the dev server
npm run dev
