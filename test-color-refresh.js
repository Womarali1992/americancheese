// Test script to simulate admin panel theme change event
// This simulates what happens when you select a theme in the admin panel

console.log('Testing color refresh system...');

// Dispatch the themeChanged event that components are listening for
const themeChangeEvent = new CustomEvent('themeChanged', { 
  detail: { 
    theme: {
      name: "Test Theme",
      tier1: {
        structural: "#10b981",
        systems: "#3b82f6", 
        sheathing: "#f59e0b",
        finishings: "#8b5cf6"
      }
    }
  }
});

window.dispatchEvent(themeChangeEvent);
console.log('Theme change event dispatched - components should refresh now');