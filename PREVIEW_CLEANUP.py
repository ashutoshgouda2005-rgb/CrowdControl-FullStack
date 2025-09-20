#!/usr/bin/env python3
"""
Preview Repository Cleanup
Shows what files will be removed without actually removing them
"""

import os
from pathlib import Path

class CleanupPreview:
    """Preview what files will be removed during cleanup"""
    
    def __init__(self, repo_path=None):
        self.repo_path = Path(repo_path) if repo_path else Path(__file__).parent
        self.files_to_remove = []
        self.dirs_to_remove = []
        self.total_size = 0
        
    def get_file_size(self, file_path):
        """Get file size in bytes"""
        try:
            return file_path.stat().st_size
        except:
            return 0
    
    def add_file_for_removal(self, file_path, reason=""):
        """Add file to removal list"""
        if file_path.exists():
            size = self.get_file_size(file_path)
            self.files_to_remove.append({
                'path': file_path,
                'name': file_path.name,
                'size': size,
                'reason': reason
            })
            self.total_size += size
    
    def add_dir_for_removal(self, dir_path, reason=""):
        """Add directory to removal list"""
        if dir_path.exists() and dir_path.is_dir():
            total_size = sum(self.get_file_size(f) for f in dir_path.rglob('*') if f.is_file())
            file_count = len(list(dir_path.rglob('*')))
            self.dirs_to_remove.append({
                'path': dir_path,
                'name': dir_path.name,
                'size': total_size,
                'file_count': file_count,
                'reason': reason
            })
            self.total_size += total_size
    
    def preview_cleanup(self):
        """Preview all files and directories that will be removed"""
        print("REPOSITORY CLEANUP PREVIEW")
        print("=" * 60)
        print("This shows what will be removed WITHOUT actually removing anything.")
        print()
        
        # Duplicate documentation files
        print("DUPLICATE DOCUMENTATION FILES:")
        redundant_docs = [
            "ABOUT_THE_TEAM.md", "COMMUNITY_AND_SUPPORT.md", "DATA_FLOW_ANALYSIS_REPORT.md",
            "ERROR_FIXES_APPLIED.md", "FIXES_APPLIED.md", "GITLAB_SETUP.md",
            "PERFORMANCE_METRICS.md", "PROJECT_INFO.md", "PUSH_TO_GITLAB.md",
            "SYSTEM_READY.md", "VSCODE_DEPLOYMENT.md", "AI_SYSTEM_COMPLETE.md",
            "BACKEND_DEPLOYMENT.md"
        ]
        
        for doc in redundant_docs:
            file_path = self.repo_path / doc
            self.add_file_for_removal(file_path, "Redundant documentation")
        
        # Test and temporary files
        print("TEST AND TEMPORARY FILES:")
        test_files = [
            "img1.png", "rest.jpg", "test1.jpg", "labels.csv", "checkpoint",
            "simple_test.py", "predict_image.py", "main.py"
        ]
        
        for test_file in test_files:
            file_path = self.repo_path / test_file
            self.add_file_for_removal(file_path, "Test/temporary file")
        
        # Redundant batch files
        print("REDUNDANT BATCH FILES:")
        redundant_batch_files = [
            "deploy-backend.bat", "deploy-frontend.bat", "deploy-vercel.bat",
            "push-to-gitlab.bat", "setup-backend.bat", "setup-dev.ps1",
            "start_backend.bat", "start_frontend.bat", "TEST_SYSTEM.bat",
            "DEPLOY_NOW.bat", "DEPLOY_PRODUCTION.bat", "FIX_PHONE_ACCESS.bat"
        ]
        
        for batch_file in redundant_batch_files:
            file_path = self.repo_path / batch_file
            self.add_file_for_removal(file_path, "Redundant batch file")
        
        # Large binary files
        print("LARGE BINARY FILES:")
        large_files = ["haarcascade_frontalface_default.xml"]
        
        for large_file in large_files:
            file_path = self.repo_path / large_file
            if file_path.exists():
                size = self.get_file_size(file_path)
                if size > 100000:  # Files larger than 100KB
                    self.add_file_for_removal(file_path, f"Large binary file ({size/1024:.1f}KB)")
        
        # Development artifacts
        print("DEVELOPMENT ARTIFACTS:")
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
                self.add_dir_for_removal(cache_dir, "Development cache/artifacts")
        
        # Development database
        db_file = self.repo_path / "backend" / "db.sqlite3"
        if db_file.exists():
            self.add_file_for_removal(db_file, "Development database")
        
        # Redundant config files
        print("REDUNDANT CONFIG FILES:")
        redundant_configs = [
            "vscode-settings.json", "vscode-tasks.json", "TEST_URLS.html", "ADMIN_ACCESS.html"
        ]
        
        for config_file in redundant_configs:
            file_path = self.repo_path / config_file
            self.add_file_for_removal(file_path, "Redundant config file")
        
        # Display summary
        self.display_summary()
    
    def display_summary(self):
        """Display cleanup summary"""
        print("\n" + "=" * 60)
        print("CLEANUP SUMMARY")
        print("=" * 60)
        
        print(f"Files to remove: {len(self.files_to_remove)}")
        print(f"Directories to remove: {len(self.dirs_to_remove)}")
        print(f"Total space to save: {self.total_size / 1024 / 1024:.2f} MB")
        
        if self.files_to_remove:
            print(f"\nFILES TO REMOVE:")
            by_reason = {}
            for file_info in self.files_to_remove:
                reason = file_info['reason']
                if reason not in by_reason:
                    by_reason[reason] = []
                by_reason[reason].append(file_info)
            
            for reason, files in by_reason.items():
                print(f"\n   {reason}:")
                for file_info in files:
                    size_str = f"({file_info['size']/1024:.1f}KB)" if file_info['size'] > 1024 else f"({file_info['size']}B)"
                    print(f"   - {file_info['name']} {size_str}")
        
        if self.dirs_to_remove:
            print(f"\nDIRECTORIES TO REMOVE:")
            for dir_info in self.dirs_to_remove:
                size_str = f"({dir_info['size']/1024:.1f}KB)" if dir_info['size'] > 1024 else f"({dir_info['size']}B)"
                print(f"   - {dir_info['name']} {size_str} - {dir_info['reason']}")
        
        print(f"\nESSENTIAL FILES THAT WILL REMAIN:")
        essential_files = [
            "README.md", "COMPLETE_SETUP_GUIDE.md", "DEPLOYMENT_GUIDE.md",
            "AI_MODEL_DOCUMENTATION.md", "CAMERA_AND_DETECTION_FIXES.md",
            "START_EVERYTHING.bat", "START_MOBILE_ACCESS.bat", "START_UNIVERSAL_ACCESS.bat",
            "DEBUG_AND_FIX_ISSUES.py", "QUICK_TEST_FIXES.py",
            "ai_model/", "backend/", "frontend/"
        ]
        
        for essential in essential_files:
            if (self.repo_path / essential).exists():
                print(f"   [KEEP] {essential}")
        
        print(f"\nNEXT STEPS:")
        print(f"   1. If this looks good, run: CLEANUP_AND_PUSH.bat")
        print(f"   2. Or run the cleanup manually: python CLEANUP_REPOSITORY.py")
        print(f"   3. Review changes before pushing to GitHub")

def main():
    """Main preview function"""
    preview = CleanupPreview()
    preview.preview_cleanup()

if __name__ == "__main__":
    main()
