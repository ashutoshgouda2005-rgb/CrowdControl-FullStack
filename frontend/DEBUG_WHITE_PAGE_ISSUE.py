#!/usr/bin/env python3
"""
🔍 CrowdControl Frontend White Page Debugger
============================================

This script helps diagnose and fix the blank white page issue in your Vite-based React frontend.
It performs comprehensive checks and provides step-by-step debugging guidance.
"""

import os
import json
import subprocess
import sys
from pathlib import Path

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")

def print_step(step, description):
    print(f"\n📋 Step {step}: {description}")
    print("-" * 50)

def check_file_exists(file_path, description):
    """Check if a file exists and report status"""
    if os.path.exists(file_path):
        print(f"✅ {description}: EXISTS")
        return True
    else:
        print(f"❌ {description}: MISSING")
        return False

def read_file_safely(file_path):
    """Safely read a file and return its content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"❌ Error reading {file_path}: {e}")
        return None

def check_package_json():
    """Check package.json for issues"""
    print_step(1, "Checking package.json and dependencies")
    
    package_path = "package.json"
    if not check_file_exists(package_path, "package.json"):
        return False
    
    try:
        with open(package_path, 'r') as f:
            package_data = json.load(f)
        
        print("✅ package.json is valid JSON")
        
        # Check critical dependencies
        deps = package_data.get('dependencies', {})
        dev_deps = package_data.get('devDependencies', {})
        
        critical_deps = ['react', 'react-dom', 'vite']
        missing_deps = []
        
        for dep in critical_deps:
            if dep not in deps and dep not in dev_deps:
                missing_deps.append(dep)
        
        if missing_deps:
            print(f"❌ Missing critical dependencies: {missing_deps}")
            return False
        else:
            print("✅ All critical dependencies present")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ package.json is invalid JSON: {e}")
        return False
    except Exception as e:
        print(f"❌ Error checking package.json: {e}")
        return False

def check_vite_config():
    """Check Vite configuration"""
    print_step(2, "Checking Vite configuration")
    
    vite_config_path = "vite.config.js"
    if not check_file_exists(vite_config_path, "vite.config.js"):
        return False
    
    content = read_file_safely(vite_config_path)
    if content:
        if 'defineConfig' in content and '@vitejs/plugin-react' in content:
            print("✅ Vite config appears valid")
            return True
        else:
            print("❌ Vite config may be malformed")
            return False
    
    return False

def check_entry_files():
    """Check main entry files"""
    print_step(3, "Checking entry files")
    
    files_to_check = [
        ("index.html", "HTML entry point"),
        ("src/main.jsx", "JavaScript entry point"),
        ("src/App.jsx", "Main App component"),
        ("src/index.css", "Main CSS file")
    ]
    
    all_exist = True
    for file_path, description in files_to_check:
        if not check_file_exists(file_path, description):
            all_exist = False
    
    return all_exist

def check_imports_in_file(file_path, file_description):
    """Check for import issues in a specific file"""
    print(f"\n🔍 Checking imports in {file_description}")
    
    content = read_file_safely(file_path)
    if not content:
        return False
    
    # Look for common import patterns that might fail
    lines = content.split('\n')
    import_issues = []
    
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if line.startswith('import '):
            # Check for relative imports that might not exist
            if './components/' in line or './contexts/' in line or './services/' in line:
                # Extract the import path
                if 'from ' in line:
                    import_path = line.split('from ')[-1].strip().strip("';\"")
                    if import_path.startswith('./'):
                        # Convert to actual file path
                        base_dir = os.path.dirname(file_path)
                        actual_path = os.path.join(base_dir, import_path.replace('./', ''))
                        
                        # Check common extensions
                        possible_paths = [
                            actual_path + '.jsx',
                            actual_path + '.js',
                            actual_path + '/index.jsx',
                            actual_path + '/index.js'
                        ]
                        
                        exists = any(os.path.exists(p) for p in possible_paths)
                        if not exists:
                            import_issues.append(f"Line {i}: {line} - File may not exist")
    
    if import_issues:
        print("❌ Potential import issues found:")
        for issue in import_issues:
            print(f"   {issue}")
        return False
    else:
        print("✅ No obvious import issues detected")
        return True

def check_main_components():
    """Check main React components for issues"""
    print_step(4, "Checking main React components")
    
    components_to_check = [
        ("src/main.jsx", "Main entry point"),
        ("src/App.jsx", "Main App component"),
        ("src/contexts/AppContext.jsx", "App Context"),
        ("src/components/ui/ErrorBoundary.jsx", "Error Boundary")
    ]
    
    all_good = True
    for file_path, description in components_to_check:
        if os.path.exists(file_path):
            if not check_imports_in_file(file_path, description):
                all_good = False
        else:
            print(f"❌ {description} missing: {file_path}")
            all_good = False
    
    return all_good

def check_node_modules():
    """Check if node_modules is properly installed"""
    print_step(5, "Checking node_modules installation")
    
    if not os.path.exists("node_modules"):
        print("❌ node_modules directory missing")
        print("💡 Run: npm install")
        return False
    
    # Check for critical packages
    critical_packages = [
        "node_modules/react",
        "node_modules/react-dom", 
        "node_modules/vite",
        "node_modules/@vitejs/plugin-react"
    ]
    
    missing_packages = []
    for package in critical_packages:
        if not os.path.exists(package):
            missing_packages.append(package.replace("node_modules/", ""))
    
    if missing_packages:
        print(f"❌ Missing packages: {missing_packages}")
        print("💡 Run: npm install")
        return False
    else:
        print("✅ Critical packages installed")
        return True

def create_minimal_test():
    """Create a minimal test to isolate the issue"""
    print_step(6, "Creating minimal test setup")
    
    # Create a minimal main.jsx for testing
    minimal_main = '''import React from 'react'
import ReactDOM from 'react-dom/client'
import MinimalApp from './App.minimal.test.jsx'

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
}
'''
    
    # Backup original main.jsx
    if os.path.exists("src/main.jsx"):
        with open("src/main.jsx.backup", 'w') as f:
            f.write(read_file_safely("src/main.jsx"))
        print("✅ Backed up original main.jsx to main.jsx.backup")
    
    # Write minimal main.jsx
    with open("src/main.minimal.jsx", 'w') as f:
        f.write(minimal_main)
    
    print("✅ Created src/main.minimal.jsx for testing")
    print("✅ Created src/App.minimal.test.jsx for testing")
    
    return True

def generate_debugging_commands():
    """Generate debugging commands for the user"""
    print_step(7, "Debugging Commands and Next Steps")
    
    print("""
🔧 DEBUGGING COMMANDS TO RUN:

1. Test with minimal app:
   # Temporarily use minimal main.jsx
   cp src/main.jsx src/main.jsx.backup
   cp src/main.minimal.jsx src/main.jsx
   npm run dev
   
   # If this works, the issue is in your main App components

2. Check browser console:
   # Open browser DevTools (F12)
   # Look for JavaScript errors in Console tab
   # Look for failed network requests in Network tab

3. Check Vite server output:
   # Look for compilation errors in terminal
   # Check for missing file warnings

4. Restore original and test step by step:
   cp src/main.jsx.backup src/main.jsx
   # Then comment out components one by one in App.jsx

5. Check specific component imports:
   # Test each import individually
   # Look for typos in file paths
   # Verify all imported files exist

🚨 COMMON ISSUES TO CHECK:

❌ Missing files: Check if all imported components exist
❌ Syntax errors: Look for unclosed brackets, missing semicolons
❌ Import path errors: Verify relative paths are correct
❌ API connection failures: Backend not running on port 8000
❌ WebSocket connection issues: Can cause context to crash
❌ Missing dependencies: Run 'npm install' if packages are missing

💡 QUICK FIXES:

1. If minimal app works:
   - Issue is in main App.jsx or its dependencies
   - Comment out components one by one to isolate

2. If minimal app doesn't work:
   - Check browser console for JavaScript errors
   - Verify Vite server is running without errors
   - Check if port 5176 is accessible

3. If you see network errors:
   - Make sure Django backend is running on port 8000
   - Check CORS configuration
   - Verify API endpoints exist
""")

def main():
    """Main debugging function"""
    print_header("CrowdControl Frontend White Page Debugger")
    
    # Change to frontend directory
    if os.path.exists("frontend"):
        os.chdir("frontend")
        print("📁 Changed to frontend directory")
    elif not os.path.exists("package.json"):
        print("❌ Not in frontend directory and can't find it!")
        print("💡 Please run this script from the frontend directory or project root")
        return
    
    print(f"📁 Working directory: {os.getcwd()}")
    
    # Run all checks
    checks = [
        check_package_json,
        check_vite_config, 
        check_entry_files,
        check_main_components,
        check_node_modules,
        create_minimal_test
    ]
    
    results = []
    for check in checks:
        try:
            result = check()
            results.append(result)
        except Exception as e:
            print(f"❌ Check failed with error: {e}")
            results.append(False)
    
    # Summary
    print_header("DIAGNOSIS SUMMARY")
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print("🎉 All checks passed! The issue might be runtime-related.")
        print("💡 Try the minimal test app to isolate the problem.")
    else:
        print(f"⚠️  {total - passed} issues found out of {total} checks")
        print("💡 Fix the issues above and try again.")
    
    generate_debugging_commands()
    
    print_header("DEBUGGING COMPLETE")
    print("🔍 Check the output above for specific issues and solutions.")
    print("💡 Run the suggested commands to isolate and fix the problem.")

if __name__ == "__main__":
    main()
