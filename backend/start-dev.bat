@echo off
echo Starting CrowdControl Backend Development Server...
echo.

REM Navigate to backend directory
cd /d "%~dp0"

REM Set development environment variables
set DEBUG=True
set SECRET_KEY=dev-secret-key-not-for-production
set DATABASE_URL=sqlite:///db.sqlite3

echo Checking Python dependencies...
pip install -r requirements.txt

echo.
echo Running database migrations...
python manage.py migrate

echo.
echo Creating superuser (if needed)...
python init_db.py

echo.
echo Starting development server...
echo Backend will be available at: http://127.0.0.1:8000
echo API endpoints at: http://127.0.0.1:8000/api/
echo Admin panel at: http://127.0.0.1:8000/admin/
echo Health check: http://127.0.0.1:8000/api/health/
echo.
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver 127.0.0.1:8000
