# Clean Export Tool

This tool removes all the "layers" and transformations from your code export, giving you clean, readable code that matches exactly what you see in development.

## What Gets Removed

🚫 **Build Layers Removed:**
- Replit-specific plugins and development tools
- Path aliases (`@/` and `@shared/`)
- Code bundling and minification
- CSS processing transformations
- TypeScript-to-JavaScript auto-transformations

✅ **What You Get:**
- Clean, readable source code
- Original file structure preserved
- Relative imports instead of aliases
- Unminified, debuggable code
- Simple package.json without dev dependencies

## How to Use

### Option 1: Run the Export Script
```bash
node export-clean.js
```

This will create a `dist-clean/` folder with your clean exported code.

### Option 2: Manual Export Steps

If you prefer to do it manually:

1. **Build with simplified config:**
   ```bash
   npx vite build --config vite.config.simple.ts
   ```

2. **Copy your source files:**
   ```bash
   cp -r server dist-clean/
   cp -r shared dist-clean/
   ```

3. **Your clean code is ready in `dist-clean/`**

## Before vs After

**Before (with layers):**
```javascript
import { Button } from "@/components/ui/button";  // Path alias
import { schema } from "@shared/schema";          // Path alias
// Minified, bundled, transformed code
```

**After (clean export):**
```javascript
import { Button } from "../components/ui/button"; // Relative path
import { schema } from "../../shared/schema";     // Relative path
// Clean, readable source code
```

## Files Created

- `vite.config.simple.ts` - Simplified build configuration
- `export-clean.js` - Automated export script
- `dist-clean/` - Your clean exported code (after running script)

The exported code in `dist-clean/` is what you can share, deploy, or work with without any Replit-specific layers or transformations.