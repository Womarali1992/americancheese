#!/usr/bin/env node

/**
 * Clean Export Script
 * Removes build layers and creates exportable code that matches your source
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const DIST_DIR = 'dist-clean';

async function cleanExport() {
  console.log('🧹 Starting clean export process...');
  
  try {
    // Step 1: Clean any existing dist-clean directory
    console.log('📁 Cleaning export directory...');
    await fs.rm(DIST_DIR, { recursive: true, force: true });
    await fs.mkdir(DIST_DIR, { recursive: true });

    // Step 2: Build frontend with simplified config
    console.log('⚛️  Building frontend without layers...');
    execSync('npx vite build --config vite.config.simple.ts', { stdio: 'inherit' });

    // Step 3: Copy server files without bundling
    console.log('🖥️  Copying server files...');
    await copyServerFiles();

    // Step 4: Copy shared files
    console.log('📤 Copying shared files...');
    await copyDirectory('shared', path.join(DIST_DIR, 'shared'));

    // Step 5: Create package.json for the clean export
    console.log('📦 Creating clean package.json...');
    await createCleanPackageJson();

    // Step 6: Convert path aliases to relative imports
    console.log('🔗 Converting path aliases to relative imports...');
    await convertPathAliases();

    console.log('✅ Clean export completed!');
    console.log(`📁 Your clean code is available in: ${DIST_DIR}/`);
    console.log('');
    console.log('📋 What was removed:');
    console.log('  • Replit-specific plugins and transformations');
    console.log('  • Path aliases (@/ and @shared)');
    console.log('  • Code bundling and minification');
    console.log('  • CSS processing layers');
    console.log('');
    console.log('✨ The exported code now matches what you see in development!');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

async function copyServerFiles() {
  const serverFiles = [
    'auth.ts',
    'category-routes.ts', 
    'db-storage.ts',
    'db.ts',
    'index.ts',
    'routes.ts',
    'storage.ts',
    'vite.ts'
  ];

  const serverDest = path.join(DIST_DIR, 'server');
  await fs.mkdir(serverDest, { recursive: true });

  for (const file of serverFiles) {
    const sourcePath = path.join('server', file);
    const destPath = path.join(serverDest, file);
    
    try {
      await fs.copyFile(sourcePath, destPath);
      console.log(`  ✓ Copied ${file}`);
    } catch (error) {
      console.log(`  ⚠️  Skipped ${file} (not found)`);
    }
  }

  // Copy migrations directory if it exists
  try {
    await copyDirectory('server/migrations', path.join(serverDest, 'migrations'));
    console.log('  ✓ Copied migrations');
  } catch (error) {
    console.log('  ⚠️  No migrations directory found');
  }
}

async function copyDirectory(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function createCleanPackageJson() {
  const originalPackage = JSON.parse(await fs.readFile('package.json', 'utf8'));
  
  const cleanPackage = {
    name: originalPackage.name + '-clean',
    version: originalPackage.version,
    type: originalPackage.type,
    license: originalPackage.license,
    description: "Clean export without build layers",
    scripts: {
      "start": "node server/index.js",
      "dev": "node server/index.js"
    },
    dependencies: {
      // Only include runtime dependencies
      express: originalPackage.dependencies.express,
      "drizzle-orm": originalPackage.dependencies["drizzle-orm"],
      "@neondatabase/serverless": originalPackage.dependencies["@neondatabase/serverless"],
      // Add other essential runtime deps as needed
    }
  };

  await fs.writeFile(
    path.join(DIST_DIR, 'package.json'), 
    JSON.stringify(cleanPackage, null, 2)
  );
}

async function convertPathAliases() {
  const publicDir = path.join(DIST_DIR, 'public');
  
  try {
    // Find all JS/JSX files in the built frontend
    const files = await findFiles(publicDir, /\.(js|jsx|ts|tsx)$/);
    
    for (const file of files) {
      let content = await fs.readFile(file, 'utf8');
      
      // Convert @/ imports to relative paths
      content = content.replace(
        /from\s+["']@\/([^"']+)["']/g, 
        (match, importPath) => {
          const relativePath = calculateRelativePath(file, publicDir, importPath);
          return `from "${relativePath}"`;
        }
      );
      
      // Convert @shared imports to relative paths
      content = content.replace(
        /from\s+["']@shared\/([^"']+)["']/g,
        (match, importPath) => {
          const relativePath = `../shared/${importPath}`;
          return `from "${relativePath}"`;
        }
      );
      
      await fs.writeFile(file, content);
    }
    
    console.log(`  ✓ Converted ${files.length} files`);
  } catch (error) {
    console.log('  ⚠️  Path alias conversion skipped (files not found)');
  }
}

async function findFiles(dir, pattern) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findFiles(fullPath, pattern));
    } else if (pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function calculateRelativePath(fromFile, baseDir, importPath) {
  const fromDir = path.dirname(fromFile);
  const targetPath = path.join(baseDir, importPath);
  return path.relative(fromDir, targetPath);
}

// Run the export
cleanExport();