@echo off
echo ====================================================
echo    CROWDCONTROL REPOSITORY CLEANUP AND PUSH
echo ====================================================
echo.
echo This script will:
echo 1. Remove unnecessary files from the repository
echo 2. Update .gitignore to prevent future clutter
echo 3. Commit and push changes to GitHub
echo.
echo WARNING: This will permanently delete files!
echo.
set /p confirm="Continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled.
    pause
    exit /b 1
)

echo.
echo [1/5] Running repository cleanup...
python CLEANUP_REPOSITORY.py

if %errorlevel% neq 0 (
    echo ERROR: Cleanup script failed!
    pause
    exit /b 1
)

echo.
echo [2/5] Checking git status...
git status

echo.
echo [3/5] Adding all changes to git...
git add .

echo.
echo [4/5] Committing changes...
git commit -m "Repository cleanup: Remove unnecessary files and reduce size

- Removed duplicate documentation files
- Cleaned up test images and temporary files  
- Removed redundant batch files
- Cleaned up development artifacts and cache files
- Removed large binary files
- Updated .gitignore to prevent future clutter
- Created essential files documentation

This cleanup reduces repository size and improves organization."

if %errorlevel% neq 0 (
    echo ERROR: Git commit failed!
    echo This might be because there are no changes to commit.
    git status
    pause
    exit /b 1
)

echo.
echo [5/5] Pushing to GitHub...
git push origin main

if %errorlevel% neq 0 (
    echo ERROR: Git push failed!
    echo Please check your GitHub credentials and network connection.
    echo You may need to run: git push origin main
    pause
    exit /b 1
)

echo.
echo ====================================================
echo    CLEANUP AND PUSH COMPLETED SUCCESSFULLY!
echo ====================================================
echo.
echo Repository has been cleaned and pushed to GitHub.
echo.
echo Summary of changes:
echo - Removed unnecessary documentation files
echo - Cleaned up test and temporary files
echo - Removed redundant scripts and configurations
echo - Updated .gitignore for better file management
echo.
echo Your repository is now cleaner and more organized!
echo.
pause
