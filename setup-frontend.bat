@echo off
echo 🎨 Setting up CrowdControl Frontend...

cd frontend

echo 📦 Installing dependencies...
npm install

echo 🔧 Setting up environment...
if not exist .env (
    echo VITE_API_URL=http://127.0.0.1:8000 > .env
    echo VITE_WS_URL=ws://127.0.0.1:8000 >> .env
)

echo ✅ Frontend setup complete!
echo 🌐 Starting frontend development server on http://localhost:5173
npm run dev
