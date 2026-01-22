/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: "#2563eb",
          foreground: "#ffffff",
        },
        // Status colors
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        // Tier 1 category colors (matching web)
        structural: "#3b82f6",
        systems: "#22c55e",
        sheathing: "#f59e0b",
        finishings: "#a855f7",
        permitting: "#6366f1",
      },
    },
  },
  plugins: [],
};
