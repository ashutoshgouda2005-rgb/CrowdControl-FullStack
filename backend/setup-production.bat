@echo off
echo Setting up CrowdControl Backend for Production...
echo.

REM Navigate to backend directory
cd /d "%~dp0"

echo Step 1: Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Step 2: Collecting static files...
python manage.py collectstatic --noinput

echo.
echo Step 3: Running database migrations...
python manage.py migrate

echo.
echo Step 4: Creating cache table (if needed)...
python manage.py createcachetable

echo.
echo Step 5: Testing the application...
python manage.py check --deploy

echo.
echo Production setup complete!
echo.
echo Next steps:
echo 1. Set environment variables (see .env.example)
echo 2. Create superuser: python manage.py createsuperuser
echo 3. Test health endpoint: curl http://localhost:8000/api/health/
echo 4. Deploy to your chosen platform (Railway, Heroku, etc.)
echo.
pause
