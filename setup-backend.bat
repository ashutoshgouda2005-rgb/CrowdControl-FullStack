@echo off
echo 🚀 Setting up CrowdControl Backend...

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/upgrade pip
python -m pip install --upgrade pip

REM Install backend dependencies
pip install -r backend\requirements.txt

REM Change to backend directory
cd backend

REM Create environment file
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
)

REM Run database migrations
echo 📊 Setting up database...
python manage.py makemigrations
python manage.py migrate

REM Create superuser (optional)
echo 👤 Creating superuser...
echo from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@crowdcontrol.com', 'admin123') if not User.objects.filter(username='admin').exists() else None | python manage.py shell

echo ✅ Backend setup complete!
echo 🌐 To start the backend server, run: python manage.py runserver
pause
