@echo off
title CrowdControl Backend Server
color 0A
echo Starting CrowdControl Backend Server...
echo.
echo Backend will run on: http://0.0.0.0:8000
echo Access from any device: http://YOUR_IP:8000
echo.
echo Press Ctrl+C to stop the server
echo.
call venv\Scripts\activate.bat
cd backend
python manage.py runserver 0.0.0.0:8000
