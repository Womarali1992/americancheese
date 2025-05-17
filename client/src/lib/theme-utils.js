/**
 * Simple utility for applying theme colors directly to CSS variables 
 * without relying on React state or context
 */

// Apply a theme's colors directly to CSS variables
export function applyThemeColors(theme) {
  if (!theme || !theme.tier1) return;
  
  // Set the CSS variables for tier1 categories
  document.documentElement.style.setProperty('--tier1-structural', theme.tier1.structural);
  document.documentElement.style.setProperty('--tier1-systems', theme.tier1.systems);
  document.documentElement.style.setProperty('--tier1-sheathing', theme.tier1.sheathing);
  document.documentElement.style.setProperty('--tier1-finishings', theme.tier1.finishings);
  
  console.log("Applied theme colors to CSS variables:", {
    structural: theme.tier1.structural,
    systems: theme.tier1.systems,
    sheathing: theme.tier1.sheathing,
    finishings: theme.tier1.finishings
  });
  
  // Force a refresh of the UI
  document.body.classList.add('theme-updated');
  setTimeout(() => {
    document.body.classList.remove('theme-updated');
  }, 50);
}

// Load theme from localStorage and apply it
export function loadAndApplyTheme() {
  try {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      const theme = JSON.parse(savedTheme);
      applyThemeColors(theme);
      return theme;
    }
  } catch (error) {
    console.error("Error loading theme from localStorage:", error);
  }
  return null;
}

// Save theme to localStorage and apply it
export function saveAndApplyTheme(theme) {
  try {
    localStorage.setItem('selectedTheme', JSON.stringify(theme));
    applyThemeColors(theme);
    return true;
  } catch (error) {
    console.error("Error saving theme to localStorage:", error);
    return false;
  }
}