#!/usr/bin/env python3
"""
Repository Cleanup Script
Removes unnecessary files from CrowdControl repository to reduce size and improve organization
"""

import os
import shutil
import subprocess
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RepositoryCleanup:
    """Clean up unnecessary files from the repository"""
    
    def __init__(self, repo_path=None):
        self.repo_path = Path(repo_path) if repo_path else Path(__file__).parent
        self.removed_files = []
        self.removed_dirs = []
        self.total_size_saved = 0
        
    def get_file_size(self, file_path):
        """Get file size in bytes"""
        try:
            return file_path.stat().st_size
        except:
            return 0
    
    def remove_file(self, file_path, reason=""):
        """Safely remove a file and track it"""
        try:
            if file_path.exists():
                size = self.get_file_size(file_path)
                file_path.unlink()
                self.removed_files.append(str(file_path))
                self.total_size_saved += size
                logger.info(f"Removed file: {file_path.name} ({size} bytes) - {reason}")
                return True
        except Exception as e:
            logger.error(f"Failed to remove {file_path}: {e}")
        return False
    
    def remove_directory(self, dir_path, reason=""):
        """Safely remove a directory and track it"""
        try:
            if dir_path.exists() and dir_path.is_dir():
                # Calculate total size
                total_size = sum(self.get_file_size(f) for f in dir_path.rglob('*') if f.is_file())
                shutil.rmtree(dir_path)
                self.removed_dirs.append(str(dir_path))
                self.total_size_saved += total_size
                logger.info(f"Removed directory: {dir_path.name} ({total_size} bytes) - {reason}")
                return True
        except Exception as e:
            logger.error(f"Failed to remove directory {dir_path}: {e}")
        return False
    
    def cleanup_duplicate_documentation(self):
        """Remove duplicate and redundant documentation files"""
        print("\nCleaning up duplicate documentation...")
        
        # Files that are duplicates or redundant
        redundant_docs = [
            "ABOUT_THE_TEAM.md",  # Not essential for production
            "COMMUNITY_AND_SUPPORT.md",  # Can be in README
            "DATA_FLOW_ANALYSIS_REPORT.md",  # Development artifact
            "ERROR_FIXES_APPLIED.md",  # Temporary fix documentation
            "FIXES_APPLIED.md",  # Duplicate of above
            "GITLAB_SETUP.md",  # Specific to GitLab, not needed in repo
            "PERFORMANCE_METRICS.md",  # Can be in main docs
            "PROJECT_INFO.md",  # Info should be in README
            "PUSH_TO_GITLAB.md",  # Deployment specific, not needed in repo
            "SYSTEM_READY.md",  # Temporary status file
            "VSCODE_DEPLOYMENT.md",  # IDE specific, not essential
            "AI_SYSTEM_COMPLETE.md",  # Status file, not needed
            "BACKEND_DEPLOYMENT.md",  # Covered in main deployment guide
        ]
        
        for doc in redundant_docs:
            file_path = self.repo_path / doc
            self.remove_file(file_path, "Redundant documentation")
    
    def cleanup_test_and_temp_files(self):
        """Remove test files and temporary artifacts"""
        print("\nCleaning up test and temporary files...")
        
        # Test images and temporary files
        test_files = [
            "img1.png",  # Test image
            "rest.jpg",  # Test image
            "test1.jpg",  # Test image
            "labels.csv",  # Test data
            "checkpoint",  # Git artifact
            "simple_test.py",  # Basic test file
            "predict_image.py",  # Standalone prediction script
            "main.py",  # Standalone main file
        ]
        
        for test_file in test_files:
            file_path = self.repo_path / test_file
            self.remove_file(file_path, "Test/temporary file")
    
    def cleanup_redundant_batch_files(self):
        """Remove redundant batch files, keeping only essential ones"""
        print("\n⚙️ Cleaning up redundant batch files...")
        
        # Keep essential batch files, remove redundant ones
        redundant_batch_files = [
            "deploy-backend.bat",  # Covered by main deployment
            "deploy-frontend.bat",  # Covered by main deployment
            "deploy-vercel.bat",  # Specific deployment method
            "push-to-gitlab.bat",  # Git operation, not needed in repo
            "setup-backend.bat",  # Redundant with setup-backend-simple.bat
            "setup-dev.ps1",  # PowerShell version, keep .bat
            "start_backend.bat",  # Redundant with START_EVERYTHING.bat
            "start_frontend.bat",  # Redundant with START_EVERYTHING.bat
            "TEST_SYSTEM.bat",  # Development testing
            "DEPLOY_NOW.bat",  # Redundant with other deployment scripts
            "DEPLOY_PRODUCTION.bat",  # Specific deployment method
            "FIX_PHONE_ACCESS.bat",  # Specific fix, not needed anymore
        ]
        
        for batch_file in redundant_batch_files:
            file_path = self.repo_path / batch_file
            self.remove_file(file_path, "Redundant batch file")
    
    def cleanup_large_binary_files(self):
        """Remove large binary files that shouldn't be in repo"""
        print("\n📦 Cleaning up large binary files...")
        
        # Large files that can be downloaded separately
        large_files = [
            "haarcascade_frontalface_default.xml",  # 930KB - OpenCV file, can be downloaded
        ]
        
        for large_file in large_files:
            file_path = self.repo_path / large_file
            if file_path.exists():
                size = self.get_file_size(file_path)
                if size > 100000:  # Files larger than 100KB
                    self.remove_file(file_path, f"Large binary file ({size/1024:.1f}KB)")
    
    def cleanup_development_artifacts(self):
        """Remove development artifacts and cache files"""
        print("\n🔧 Cleaning up development artifacts...")
        
        # Remove cache directories
        cache_dirs = [
            self.repo_path / "ai_model" / "__pycache__",
            self.repo_path / "backend" / "logs",
            self.repo_path / "backend" / "media",
            self.repo_path / "frontend" / "node_modules",
            self.repo_path / "frontend" / "dist",
            self.repo_path / "ai_model" / "logs",
            self.repo_path / "ai_model" / "checkpoints",
            self.repo_path / "ai_model" / "data",
            self.repo_path / "ai_model" / "models",
        ]
        
        for cache_dir in cache_dirs:
            if cache_dir.exists() and any(cache_dir.iterdir()):
                self.remove_directory(cache_dir, "Development cache/artifacts")
        
        # Remove development database
        db_file = self.repo_path / "backend" / "db.sqlite3"
        if db_file.exists():
            self.remove_file(db_file, "Development database")
    
    def cleanup_redundant_config_files(self):
        """Remove redundant configuration files"""
        print("\n⚙️ Cleaning up redundant config files...")
        
        redundant_configs = [
            "vscode-settings.json",  # IDE specific
            "vscode-tasks.json",  # IDE specific
            "TEST_URLS.html",  # Development testing
            "ADMIN_ACCESS.html",  # Development access
        ]
        
        for config_file in redundant_configs:
            file_path = self.repo_path / config_file
            self.remove_file(file_path, "Redundant config file")
    
    def update_gitignore(self):
        """Update .gitignore to prevent future clutter"""
        print("\n📝 Updating .gitignore...")
        
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
        
        gitignore_path = self.repo_path / ".gitignore"
        try:
            with open(gitignore_path, 'a', encoding='utf-8') as f:
                f.write(gitignore_additions)
            logger.info("Updated .gitignore with additional rules")
        except Exception as e:
            logger.error(f"Failed to update .gitignore: {e}")
    
    def create_essential_files_list(self):
        """Create a list of essential files that should remain"""
        essential_files = {
            "Documentation": [
                "README.md",
                "COMPLETE_SETUP_GUIDE.md",
                "DEPLOYMENT_GUIDE.md",
                "AI_MODEL_DOCUMENTATION.md",
                "CAMERA_AND_DETECTION_FIXES.md",
                "TROUBLESHOOTING_GUIDE.md",
                "USER_DASHBOARD_GUIDE.md",
            ],
            "Scripts": [
                "START_EVERYTHING.bat",
                "START_MOBILE_ACCESS.bat",
                "START_UNIVERSAL_ACCESS.bat",
                "TRAIN_AI_MODEL.bat",
                "setup-backend-simple.bat",
                "setup-frontend.bat",
                "DEBUG_AND_FIX_ISSUES.py",
                "QUICK_TEST_FIXES.py",
            ],
            "Configuration": [
                ".gitignore",
                "requirements.txt",
                "netlify.toml",
                "vercel.json",
            ],
            "Core Directories": [
                "ai_model/",
                "backend/",
                "frontend/",
            ]
        }
        
        # Write essential files list
        essential_path = self.repo_path / "ESSENTIAL_FILES.md"
        with open(essential_path, 'w', encoding='utf-8') as f:
            f.write("# Essential Files in CrowdControl Repository\n\n")
            f.write("This document lists the essential files that should remain in the repository.\n\n")
            
            for category, files in essential_files.items():
                f.write(f"## {category}\n\n")
                for file in files:
                    f.write(f"- `{file}`\n")
                f.write("\n")
        
        logger.info("Created ESSENTIAL_FILES.md")
    
    def run_cleanup(self):
        """Run the complete cleanup process"""
        print("STARTING REPOSITORY CLEANUP")
        print("=" * 50)
        
        # Run all cleanup operations
        self.cleanup_duplicate_documentation()
        self.cleanup_test_and_temp_files()
        self.cleanup_redundant_batch_files()
        self.cleanup_large_binary_files()
        self.cleanup_development_artifacts()
        self.cleanup_redundant_config_files()
        
        # Update configuration
        self.update_gitignore()
        self.create_essential_files_list()
        
        # Generate summary
        self.generate_cleanup_summary()
    
    def generate_cleanup_summary(self):
        """Generate a summary of the cleanup operation"""
        print("\n" + "=" * 50)
        print("🎉 CLEANUP COMPLETED")
        print("=" * 50)
        
        print(f"📁 Files removed: {len(self.removed_files)}")
        print(f"📂 Directories removed: {len(self.removed_dirs)}")
        print(f"💾 Total space saved: {self.total_size_saved / 1024 / 1024:.2f} MB")
        
        if self.removed_files:
            print(f"\n📄 Removed files:")
            for file in self.removed_files[-10:]:  # Show last 10
                print(f"   - {Path(file).name}")
            if len(self.removed_files) > 10:
                print(f"   ... and {len(self.removed_files) - 10} more")
        
        if self.removed_dirs:
            print(f"\n📂 Removed directories:")
            for dir in self.removed_dirs:
                print(f"   - {Path(dir).name}")
        
        print(f"\n✅ Repository is now cleaner and more organized!")
        print(f"📋 Next steps:")
        print(f"   1. Review the changes")
        print(f"   2. Test that everything still works")
        print(f"   3. Commit and push the cleaned repository")
        
        # Create cleanup report
        report_path = self.repo_path / "CLEANUP_REPORT.md"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"# Repository Cleanup Report\n\n")
            f.write(f"**Date:** {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"## Summary\n\n")
            f.write(f"- Files removed: {len(self.removed_files)}\n")
            f.write(f"- Directories removed: {len(self.removed_dirs)}\n")
            f.write(f"- Space saved: {self.total_size_saved / 1024 / 1024:.2f} MB\n\n")
            
            if self.removed_files:
                f.write(f"## Removed Files\n\n")
                for file in self.removed_files:
                    f.write(f"- {Path(file).name}\n")
                f.write(f"\n")
            
            if self.removed_dirs:
                f.write(f"## Removed Directories\n\n")
                for dir in self.removed_dirs:
                    f.write(f"- {Path(dir).name}\n")
        
        logger.info(f"Cleanup report saved to: {report_path}")

def main():
    """Main cleanup function"""
    cleanup = RepositoryCleanup()
    cleanup.run_cleanup()

if __name__ == "__main__":
    main()
