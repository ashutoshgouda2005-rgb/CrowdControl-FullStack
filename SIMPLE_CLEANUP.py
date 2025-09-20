#!/usr/bin/env python3
"""
Simple Repository Cleanup Script
Removes unnecessary files from CrowdControl repository
"""

import os
import shutil
from pathlib import Path

def cleanup_repository():
    """Clean up unnecessary files"""
    repo_path = Path(__file__).parent
    removed_files = []
    total_size_saved = 0
    
    print("STARTING REPOSITORY CLEANUP")
    print("=" * 50)
    
    # Files to remove
    files_to_remove = [
        # Redundant documentation
        "ABOUT_THE_TEAM.md", "COMMUNITY_AND_SUPPORT.md", "DATA_FLOW_ANALYSIS_REPORT.md",
        "ERROR_FIXES_APPLIED.md", "FIXES_APPLIED.md", "GITLAB_SETUP.md",
        "PERFORMANCE_METRICS.md", "PROJECT_INFO.md", "PUSH_TO_GITLAB.md",
        "SYSTEM_READY.md", "VSCODE_DEPLOYMENT.md", "AI_SYSTEM_COMPLETE.md",
        "BACKEND_DEPLOYMENT.md",
        
        # Test and temporary files
        "img1.png", "rest.jpg", "test1.jpg", "labels.csv", "checkpoint",
        "simple_test.py", "predict_image.py", "main.py",
        
        # Redundant batch files
        "deploy-backend.bat", "deploy-frontend.bat", "deploy-vercel.bat",
        "push-to-gitlab.bat", "setup-backend.bat", "setup-dev.ps1",
        "start_backend.bat", "start_frontend.bat", "TEST_SYSTEM.bat",
        "DEPLOY_NOW.bat", "DEPLOY_PRODUCTION.bat", "FIX_PHONE_ACCESS.bat",
        
        # Large binary files
        "haarcascade_frontalface_default.xml",
        
        # Development database
        "backend/db.sqlite3",
        
        # Redundant config files
        "vscode-settings.json", "vscode-tasks.json", "TEST_URLS.html", "ADMIN_ACCESS.html"
    ]
    
    # Directories to remove
    dirs_to_remove = [
        "ai_model/__pycache__",
        "backend/logs",
        "backend/media",
        "frontend/node_modules",
        "frontend/dist",
        "ai_model/logs",
        "ai_model/checkpoints",
        "ai_model/data",
        "ai_model/models",
    ]
    
    # Remove files
    print("\nRemoving files...")
    for file_name in files_to_remove:
        file_path = repo_path / file_name
        if file_path.exists():
            try:
                size = file_path.stat().st_size
                file_path.unlink()
                removed_files.append(file_name)
                total_size_saved += size
                print(f"  Removed: {file_name} ({size/1024:.1f}KB)")
            except Exception as e:
                print(f"  Failed to remove {file_name}: {e}")
    
    # Remove directories
    print("\nRemoving directories...")
    for dir_name in dirs_to_remove:
        dir_path = repo_path / dir_name
        if dir_path.exists() and dir_path.is_dir():
            try:
                # Calculate size
                total_dir_size = sum(f.stat().st_size for f in dir_path.rglob('*') if f.is_file())
                shutil.rmtree(dir_path)
                total_size_saved += total_dir_size
                print(f"  Removed directory: {dir_name} ({total_dir_size/1024:.1f}KB)")
            except Exception as e:
                print(f"  Failed to remove directory {dir_name}: {e}")
    
    # Update .gitignore
    print("\nUpdating .gitignore...")
    gitignore_additions = """
# Additional ignores for clean repository
*.pyc
__pycache__/
*.pyo
*.pyd
.Python
env/
venv/
.venv
pip-log.txt
pip-delete-this-directory.txt
.tox
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache
.pytest_cache
.hypothesis

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Development artifacts
*.sqlite3
node_modules/
dist/
build/
logs/
checkpoints/
models/
data/
media/

# Large files
*.xml
*.jpg
*.png
*.jpeg
*.gif
*.pdf
*.zip
*.tar.gz
"""
    
    gitignore_path = repo_path / ".gitignore"
    try:
        with open(gitignore_path, 'a', encoding='utf-8') as f:
            f.write(gitignore_additions)
        print("  Updated .gitignore")
    except Exception as e:
        print(f"  Failed to update .gitignore: {e}")
    
    # Create cleanup report
    print("\nCreating cleanup report...")
    report_path = repo_path / "CLEANUP_REPORT.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(f"# Repository Cleanup Report\n\n")
        f.write(f"**Date:** {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"## Summary\n\n")
        f.write(f"- Files removed: {len(removed_files)}\n")
        f.write(f"- Space saved: {total_size_saved / 1024 / 1024:.2f} MB\n\n")
        f.write(f"## Removed Files\n\n")
        for file in removed_files:
            f.write(f"- {file}\n")
    
    print("\n" + "=" * 50)
    print("CLEANUP COMPLETED")
    print("=" * 50)
    print(f"Files removed: {len(removed_files)}")
    print(f"Total space saved: {total_size_saved / 1024 / 1024:.2f} MB")
    print(f"Cleanup report saved to: CLEANUP_REPORT.md")
    print("\nNext steps:")
    print("1. Review the changes")
    print("2. Test that everything still works")
    print("3. Commit and push to GitHub:")
    print("   git add .")
    print("   git commit -m 'Repository cleanup: Remove unnecessary files'")
    print("   git push origin main")

if __name__ == "__main__":
    cleanup_repository()
