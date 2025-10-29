import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simplified config for clean exports - removes Replit layers and transformations
export default defineConfig({
  plugins: [
    react({
      // Minimal React processing - preserve JSX structure where possible
      jsxRuntime: 'classic',
    }),
  ],
  resolve: {
    // Keep aliases for build process, we'll convert them afterward
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Disable minification to keep code readable
    minify: false,
    // Generate source maps for easier debugging
    sourcemap: true,
    rollupOptions: {
      output: {
        // Don't hash filenames - keep them simple
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',  
        assetFileNames: '[name].[ext]',
      },
    },
  },
});