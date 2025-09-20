Write-Host "🚀 Setting up CrowdControl Development Environment..." -ForegroundColor Green

# Activate virtual environment
& "venv\Scripts\Activate.ps1"

# Change to backend directory
Set-Location backend

# Run migrations
Write-Host "📊 Setting up SQLite database..." -ForegroundColor Yellow
python manage.py makemigrations
python manage.py migrate

# Create superuser
Write-Host "👤 Creating admin user..." -ForegroundColor Yellow
$createUser = @"
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@crowdcontrol.com', 'admin123')
    print('Admin user created: admin/admin123')
else:
    print('Admin user already exists')
"@

$createUser | python manage.py shell

Write-Host "✅ Backend setup complete!" -ForegroundColor Green
Write-Host "🌐 Starting backend server..." -ForegroundColor Yellow

# Start the development server
python manage.py runserver
