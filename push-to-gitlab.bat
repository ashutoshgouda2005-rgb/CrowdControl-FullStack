@echo off
echo ========================================
echo   PUSH CROWDCONTROL TO GITLAB
echo ========================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

echo [1/6] Initializing Git repository...
git init

echo.
echo [2/6] Adding all files to Git...
git add .

echo.
echo [3/6] Creating initial commit...
git commit -m "Initial commit: CrowdControl application with Django+DRF backend and Vite+React frontend"

echo.
echo [4/6] Setting up GitLab remote...
echo Please enter your GitLab repository URL (e.g., https://gitlab.com/username/crowdcontrol.git):
set /p GITLAB_URL="GitLab URL: "

git remote add origin %GITLAB_URL%

echo.
echo [5/6] Setting main branch...
git branch -M main

echo.
echo [6/6] Pushing to GitLab...
git push -u origin main

echo.
echo ========================================
echo   SUCCESS! CODE PUSHED TO GITLAB
echo ========================================
echo.
echo Your CrowdControl application is now on GitLab!
echo Repository URL: %GITLAB_URL%
echo.
echo Next steps:
echo 1. Set up CI/CD pipeline (optional)
echo 2. Deploy from GitLab to Vercel/Railway
echo 3. Configure environment variables
echo.
pause
