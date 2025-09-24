#!/usr/bin/env python3
"""
🔧 Automated White Page Fix for CrowdControl Frontend
===================================================

This script automatically diagnoses and fixes the most common causes of blank white pages
in the CrowdControl Vite-based React frontend.
"""

import os
import json
import shutil
import subprocess
import sys
from pathlib import Path

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🔧 {title}")
    print(f"{'='*60}")

def print_step(step, description):
    print(f"\n📋 Step {step}: {description}")
    print("-" * 50)

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_warning(message):
    print(f"⚠️  {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def run_command(command, capture_output=True):
    """Run a command and return success status and output"""
    try:
        if capture_output:
            result = subprocess.run(command, shell=True, capture_output=True, text=True)
            return result.returncode == 0, result.stdout, result.stderr
        else:
            result = subprocess.run(command, shell=True)
            return result.returncode == 0, "", ""
    except Exception as e:
        return False, "", str(e)

def check_environment():
    """Check if we're in the right directory and environment is set up"""
    print_step(1, "Checking Environment")
    
    # Check if we're in frontend directory
    if not os.path.exists("package.json"):
        if os.path.exists("frontend/package.json"):
            os.chdir("frontend")
            print_success("Changed to frontend directory")
        else:
            print_error("Cannot find frontend directory with package.json")
            return False
    
    print_success("Found package.json - in frontend directory")
    
    # Check Node.js
    success, stdout, stderr = run_command("node --version")
    if success:
        print_success(f"Node.js version: {stdout.strip()}")
    else:
        print_error("Node.js not found! Please install Node.js")
        return False
    
    # Check npm
    success, stdout, stderr = run_command("npm --version")
    if success:
        print_success(f"npm version: {stdout.strip()}")
    else:
        print_error("npm not found!")
        return False
    
    return True

def backup_critical_files():
    """Backup critical files before making changes"""
    print_step(2, "Creating Backups")
    
    files_to_backup = [
        "src/main.jsx",
        "src/App.jsx",
        "src/contexts/AppContext.jsx"
    ]
    
    for file_path in files_to_backup:
        if os.path.exists(file_path):
            backup_path = f"{file_path}.backup"
            if not os.path.exists(backup_path):
                shutil.copy2(file_path, backup_path)
                print_success(f"Backed up {file_path}")
            else:
                print_info(f"Backup already exists: {backup_path}")
        else:
            print_warning(f"File not found: {file_path}")

def fix_node_modules():
    """Fix node_modules issues"""
    print_step(3, "Fixing Node Modules")
    
    if not os.path.exists("node_modules"):
        print_warning("node_modules missing, running npm install...")
        success, stdout, stderr = run_command("npm install", capture_output=False)
        if success:
            print_success("npm install completed")
        else:
            print_error("npm install failed")
            return False
    else:
        print_success("node_modules exists")
    
    # Check critical packages
    critical_packages = ["react", "react-dom", "vite", "@vitejs/plugin-react"]
    missing_packages = []
    
    for package in critical_packages:
        if not os.path.exists(f"node_modules/{package}"):
            missing_packages.append(package)
    
    if missing_packages:
        print_warning(f"Missing packages: {missing_packages}")
        print_info("Running npm install to fix...")
        success, stdout, stderr = run_command("npm install", capture_output=False)
        if success:
            print_success("Dependencies installed")
        else:
            print_error("Failed to install dependencies")
            return False
    else:
        print_success("All critical packages present")
    
    return True

def create_minimal_test_files():
    """Create minimal test files for debugging"""
    print_step(4, "Creating Minimal Test Files")
    
    # Create minimal App component
    minimal_app = '''import React from 'react';

function MinimalApp() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      backgroundColor: '#f3f4f6',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#1f2937', marginBottom: '1rem' }}>
          🎉 Vite + React Working!
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          This minimal test page confirms that:
        </p>
        <ul style={{ 
          textAlign: 'left', 
          color: '#374151',
          listStyle: 'none',
          padding: 0
        }}>
          <li style={{ marginBottom: '0.5rem' }}>✅ Vite development server is running</li>
          <li style={{ marginBottom: '0.5rem' }}>✅ React is loading correctly</li>
          <li style={{ marginBottom: '0.5rem' }}>✅ JavaScript modules are working</li>
          <li style={{ marginBottom: '0.5rem' }}>✅ No critical import errors</li>
        </ul>
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <strong>Next Steps:</strong> If you see this page, the framework is working. 
          The issue is likely in your main App components or their dependencies.
        </div>
      </div>
    </div>
  );
}

export default MinimalApp;'''
    
    with open("src/App.minimal.jsx", "w") as f:
        f.write(minimal_app)
    print_success("Created src/App.minimal.jsx")
    
    # Create minimal main.jsx
    minimal_main = '''import React from 'react'
import ReactDOM from 'react-dom/client'
import MinimalApp from './App.minimal.jsx'

console.log('🔄 Loading minimal test app...')

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MinimalApp />
    </React.StrictMode>,
  )
  console.log('✅ Minimal app loaded successfully!')
} catch (error) {
  console.error('❌ Error loading minimal app:', error)
}'''
    
    with open("src/main.minimal.jsx", "w") as f:
        f.write(minimal_main)
    print_success("Created src/main.minimal.jsx")

def apply_safe_appcontext():
    """Apply the safe AppContext if the original exists"""
    print_step(5, "Applying Safe AppContext")
    
    if os.path.exists("src/contexts/AppContext.jsx"):
        if os.path.exists("src/contexts/AppContext.safe.jsx"):
            shutil.copy2("src/contexts/AppContext.safe.jsx", "src/contexts/AppContext.jsx")
            print_success("Applied safe AppContext")
        else:
            print_warning("Safe AppContext not found, skipping")
    else:
        print_info("Original AppContext not found, skipping")

def fix_common_import_issues():
    """Fix common import path issues"""
    print_step(6, "Checking Import Issues")
    
    # Check if critical component directories exist
    component_dirs = [
        "src/components",
        "src/components/ui",
        "src/components/layout",
        "src/contexts"
    ]
    
    for dir_path in component_dirs:
        if not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
            print_success(f"Created directory: {dir_path}")
    
    # Create placeholder components if missing
    placeholder_components = [
        ("src/components/ui/LoadingSpinner.jsx", "LoadingSpinner"),
        ("src/components/ui/ErrorBoundary.jsx", "ErrorBoundary"),
        ("src/components/layout/MainLayout.jsx", "MainLayout")
    ]
    
    for file_path, component_name in placeholder_components:
        if not os.path.exists(file_path):
            placeholder_content = f'''import React from 'react';

function {component_name}({{ children, ...props }}) {{
  return (
    <div {{...props}}>
      <div>Loading {component_name}...</div>
      {{children}}
    </div>
  );
}}

export default {component_name};'''
            
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w") as f:
                f.write(placeholder_content)
            print_success(f"Created placeholder: {file_path}")

def test_minimal_app():
    """Test the minimal app"""
    print_step(7, "Testing Minimal App")
    
    # Switch to minimal main.jsx
    if os.path.exists("src/main.jsx"):
        shutil.copy2("src/main.jsx", "src/main.jsx.original")
    
    shutil.copy2("src/main.minimal.jsx", "src/main.jsx")
    print_success("Switched to minimal main.jsx")
    
    print_info("Starting development server...")
    print_info("Check your browser at http://localhost:5176")
    print_info("Press Ctrl+C to stop the server")
    
    # Start dev server (this will block)
    success, stdout, stderr = run_command("npm run dev", capture_output=False)
    
    return success

def restore_original_files():
    """Restore original files"""
    print_step(8, "Restoration Options")
    
    print("Choose what to restore:")
    print("1. Restore original main.jsx")
    print("2. Keep minimal main.jsx")
    print("3. Restore all backups")
    
    choice = input("Enter choice (1-3): ").strip()
    
    if choice == "1":
        if os.path.exists("src/main.jsx.original"):
            shutil.copy2("src/main.jsx.original", "src/main.jsx")
            print_success("Restored original main.jsx")
        else:
            print_warning("No original main.jsx backup found")
    
    elif choice == "3":
        backup_files = [
            ("src/main.jsx.backup", "src/main.jsx"),
            ("src/App.jsx.backup", "src/App.jsx"),
            ("src/contexts/AppContext.jsx.backup", "src/contexts/AppContext.jsx")
        ]
        
        for backup_path, original_path in backup_files:
            if os.path.exists(backup_path):
                shutil.copy2(backup_path, original_path)
                print_success(f"Restored {original_path}")

def generate_report():
    """Generate a diagnostic report"""
    print_header("DIAGNOSTIC REPORT")
    
    print("📊 System Information:")
    print(f"   Working Directory: {os.getcwd()}")
    
    # Node.js version
    success, stdout, stderr = run_command("node --version")
    if success:
        print(f"   Node.js: {stdout.strip()}")
    
    # npm version
    success, stdout, stderr = run_command("npm --version")
    if success:
        print(f"   npm: {stdout.strip()}")
    
    print("\n📁 File Status:")
    critical_files = [
        "package.json",
        "vite.config.js",
        "index.html",
        "src/main.jsx",
        "src/App.jsx",
        "src/index.css"
    ]
    
    for file_path in critical_files:
        status = "✅ EXISTS" if os.path.exists(file_path) else "❌ MISSING"
        print(f"   {file_path}: {status}")
    
    print("\n📦 Dependencies:")
    if os.path.exists("node_modules"):
        print("   node_modules: ✅ EXISTS")
        critical_packages = ["react", "react-dom", "vite"]
        for package in critical_packages:
            status = "✅" if os.path.exists(f"node_modules/{package}") else "❌"
            print(f"   {package}: {status}")
    else:
        print("   node_modules: ❌ MISSING")

def main():
    """Main function"""
    print_header("CrowdControl Frontend White Page Auto-Fix")
    
    print("🎯 This script will automatically:")
    print("   1. Check your environment")
    print("   2. Create backups of critical files")
    print("   3. Fix common node_modules issues")
    print("   4. Create minimal test files")
    print("   5. Apply safe configurations")
    print("   6. Test with minimal app")
    print()
    
    input("Press Enter to continue...")
    
    # Run all fixes
    steps = [
        check_environment,
        backup_critical_files,
        fix_node_modules,
        create_minimal_test_files,
        apply_safe_appcontext,
        fix_common_import_issues
    ]
    
    for step in steps:
        try:
            result = step()
            if result is False:
                print_error("Step failed! Check the output above.")
                return
        except Exception as e:
            print_error(f"Step failed with error: {e}")
            return
    
    print_header("FIXES APPLIED SUCCESSFULLY")
    
    print("🎉 All automated fixes have been applied!")
    print()
    print("📋 Next Steps:")
    print("1. Test the minimal app:")
    print("   npm run dev")
    print("   Check http://localhost:5176")
    print()
    print("2. If minimal app works:")
    print("   - The framework is fine")
    print("   - Issue is in your main components")
    print("   - Use Enhanced Error Boundary to see what's crashing")
    print()
    print("3. If minimal app doesn't work:")
    print("   - Check browser console for JavaScript errors")
    print("   - Check terminal for compilation errors")
    print()
    
    # Ask if user wants to test now
    test_now = input("Would you like to test the minimal app now? (y/n): ").strip().lower()
    if test_now == 'y':
        test_minimal_app()
    
    generate_report()
    
    print_header("AUTO-FIX COMPLETE")
    print("🔍 Check the diagnostic report above")
    print("💡 Use the debugging guides for further help")
    print("🚀 Good luck!")

if __name__ == "__main__":
    main()
