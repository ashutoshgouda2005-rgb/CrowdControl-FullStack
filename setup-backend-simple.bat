@echo off
echo 🚀 Setting up CrowdControl Backend...

call venv\Scripts\activate.bat
cd backend

echo 📊 Setting up SQLite database...
python manage.py makemigrations
python manage.py migrate

echo 👤 Creating admin user...
echo from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@crowdcontrol.com', 'admin123') if not User.objects.filter(username='admin').exists() else print('Admin user already exists') | python manage.py shell

echo ✅ Backend setup complete!
echo 🌐 Starting backend server on http://127.0.0.1:8000
python manage.py runserver
