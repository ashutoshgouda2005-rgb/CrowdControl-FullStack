@echo off
title CrowdControl Frontend Server
color 0B
echo Starting CrowdControl Frontend Server...
echo.
echo Frontend will run on: http://0.0.0.0:5174
echo Access from any device: http://YOUR_IP:5174
echo.
echo Press Ctrl+C to stop the server
echo.
cd frontend
npm run dev -- --host 0.0.0.0 --port 5174
