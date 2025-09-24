# 🔍 Frontend White Page Debug Guide

## IMMEDIATE DEBUGGING STEPS

### 1. Check Browser Console (CRITICAL)
1. Open your browser to `http://localhost:5176`
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for RED error messages

**Common Error Patterns:**
```
❌ Uncaught SyntaxError: Unexpected token '<'
❌ Failed to resolve module specifier
❌ Cannot read properties of undefined
❌ Module not found: Can't resolve
❌ Uncaught ReferenceError: React is not defined
```

### 2. Check Network Tab
1. In DevTools, go to **Network** tab
2. Refresh the page
3. Look for failed requests (RED status codes)
4. Check if main JS/CSS bundles are loading

### 3. Check Vite Terminal Output
Look for these patterns in your Vite terminal:

**✅ Good (Working):**
```
  VITE v4.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5176/
  ➜  Network: use --host to expose
```

**❌ Bad (Broken):**
```
✘ [ERROR] Could not resolve "..."
✘ [ERROR] Transform failed with X errors
[vite] Internal server error: ...
```

## STEP-BY-STEP DEBUGGING PROCESS

### Phase 1: Verify Vite is Running
1. Stop Vite server (Ctrl+C)
2. Clear cache: `rm -rf node_modules/.vite` (or delete .vite folder)
3. Restart: `npm run dev`
4. Check if basic Vite page loads

### Phase 2: Test with Minimal App
Replace your main App component temporarily to isolate the issue.

### Phase 3: Identify Breaking Component
Re-enable components one by one until crash reappears.
