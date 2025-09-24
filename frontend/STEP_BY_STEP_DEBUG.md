# 🔍 Step-by-Step Frontend Debugging Guide

## **Current Issue: Blank White Page**

Your Vite-based React frontend is showing a blank white page instead of loading the application. This guide will help you systematically identify and fix the issue.

---

## **🚨 IMMEDIATE DEBUGGING STEPS**

### **Step 1: Check Browser Console**
1. Open your browser and navigate to `http://localhost:5176`
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Look for any **red error messages**
5. Take a screenshot or copy the error messages

**Common errors to look for:**
- `Cannot read property 'X' of undefined`
- `Module not found` or `Cannot resolve module`
- `Unexpected token` (syntax errors)
- `Failed to fetch` (API connection issues)

### **Step 2: Check Network Tab**
1. In Developer Tools, go to the **Network** tab
2. Refresh the page (`Ctrl+R`)
3. Look for any **failed requests** (red status codes)
4. Check if `main.jsx` and other assets are loading

### **Step 3: Check Vite Server Terminal**
1. Look at your terminal where you ran `npm run dev`
2. Check for any **compilation errors** or warnings
3. Look for messages like:
   - `✘ [ERROR] Could not resolve`
   - `Build failed`
   - `Module not found`

---

## **🧪 TESTING WITH MINIMAL APP**

### **Test 1: Verify Vite + React Works**

1. **Backup your current main.jsx:**
   ```bash
   cd frontend/src
   cp main.jsx main.jsx.backup
   ```

2. **Create minimal main.jsx:**
   ```bash
   cp main.minimal.jsx main.jsx
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   ```

4. **Check the browser:**
   - If you see the "🎉 Vite + React Working!" page, the framework is fine
   - If you still see a blank page, there's a fundamental issue

### **Test 2: If Minimal App Works**

The issue is in your main App components. Follow these steps:

1. **Restore original main.jsx:**
   ```bash
   cp main.jsx.backup main.jsx
   ```

2. **Comment out components one by one in App.jsx:**

   Start by commenting out the most complex imports:
   ```jsx
   // import { AppProvider, useApp } from './contexts/AppContext';
   // import ErrorBoundary from './components/ui/ErrorBoundary';
   // import MainLayout from './components/layout/MainLayout';
   ```

3. **Create a simple App.jsx for testing:**
   ```jsx
   import React from 'react';
   
   function App() {
     return (
       <div style={{ padding: '20px' }}>
         <h1>Simple App Test</h1>
         <p>If you see this, basic App.jsx works!</p>
       </div>
     );
   }
   
   export default App;
   ```

4. **Gradually add components back** until you find the one causing the crash.

---

## **🔧 COMMON ISSUES AND FIXES**

### **Issue 1: Missing Component Files**

**Symptoms:** `Module not found` errors in console

**Fix:**
1. Check if all imported files exist:
   ```bash
   # Check if these files exist:
   ls src/contexts/AppContext.jsx
   ls src/components/ui/ErrorBoundary.jsx
   ls src/components/layout/MainLayout.jsx
   ```

2. If files are missing, either create them or remove the imports

### **Issue 2: API Connection Failures**

**Symptoms:** Network errors, `Failed to fetch` in console

**Fix:**
1. Make sure Django backend is running on port 8000
2. Check if `http://127.0.0.1:8000/api/health/` is accessible
3. Temporarily disable API calls in AppContext.jsx

### **Issue 3: WebSocket Connection Issues**

**Symptoms:** WebSocket connection errors in console

**Fix:**
1. Comment out WebSocket initialization in AppContext.jsx:
   ```jsx
   // Temporarily disable WebSocket
   // initWebSocket(access);
   ```

### **Issue 4: Import Path Errors**

**Symptoms:** `Cannot resolve module` errors

**Fix:**
1. Check all relative import paths in your components
2. Verify file extensions (.jsx vs .js)
3. Check for typos in file names

### **Issue 5: Syntax Errors**

**Symptoms:** `Unexpected token` errors

**Fix:**
1. Check for unclosed JSX tags
2. Look for missing commas in object/array definitions
3. Verify all brackets and parentheses are properly closed

---

## **🛠️ AUTOMATED DEBUGGING**

### **Run the Debug Script**

1. **From the frontend directory, run:**
   ```bash
   python ../DEBUG_WHITE_PAGE_ISSUE.py
   ```

2. **Follow the script's recommendations**

### **Use Enhanced Error Boundary**

1. **Replace ErrorBoundary in App.jsx:**
   ```jsx
   import EnhancedErrorBoundary from './components/ui/EnhancedErrorBoundary';
   
   function App() {
     return (
       <EnhancedErrorBoundary>
         {/* Your app content */}
       </EnhancedErrorBoundary>
     );
   }
   ```

2. **This will show detailed error information instead of a blank page**

---

## **📋 DEBUGGING CHECKLIST**

### **Environment Check**
- [ ] Node.js is installed and working
- [ ] `npm install` completed successfully
- [ ] `node_modules` directory exists
- [ ] Vite dev server starts without errors

### **File Structure Check**
- [ ] `index.html` exists and has `<div id="root">`
- [ ] `src/main.jsx` exists and imports App
- [ ] `src/App.jsx` exists
- [ ] All imported components exist

### **Code Check**
- [ ] No syntax errors in JSX files
- [ ] All imports have correct paths
- [ ] No undefined variables or functions
- [ ] All brackets and parentheses are closed

### **Runtime Check**
- [ ] Browser console shows no errors
- [ ] Network tab shows all assets loading
- [ ] No failed API requests (if backend is running)

---

## **🚀 QUICK FIXES TO TRY**

### **Fix 1: Clear Cache and Restart**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

### **Fix 2: Use Enhanced Error Boundary**
Replace your current ErrorBoundary with EnhancedErrorBoundary to see detailed error information.

### **Fix 3: Disable Complex Features Temporarily**
Comment out:
- WebSocket connections
- API calls in useEffect
- Complex routing
- Third-party integrations

### **Fix 4: Check for Missing Dependencies**
```bash
# Install any missing dependencies
npm install react react-dom vite @vitejs/plugin-react
```

---

## **📞 GETTING HELP**

### **Information to Provide:**
1. **Browser console errors** (screenshots or text)
2. **Vite server terminal output**
3. **Network tab showing failed requests**
4. **Your operating system and browser version**
5. **Node.js and npm versions** (`node --version`, `npm --version`)

### **Files to Check:**
- `package.json` - Dependencies
- `vite.config.js` - Vite configuration
- `src/main.jsx` - Entry point
- `src/App.jsx` - Main component
- Browser DevTools Console and Network tabs

---

## **✅ SUCCESS INDICATORS**

You'll know the issue is fixed when:
- ✅ Browser shows your app instead of blank page
- ✅ No errors in browser console
- ✅ All assets load successfully in Network tab
- ✅ Vite server shows no compilation errors

---

**💡 Remember:** Most blank page issues are caused by JavaScript errors that prevent React from rendering. The browser console is your best friend for debugging!
