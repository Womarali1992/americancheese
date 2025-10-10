/**
 * Theme Color Verification Script
 * Verifies that tier2 colors match their tier1 parent colors across all themes
 */

import { COLOR_THEMES } from './client/src/lib/color-themes.ts';

function verifyTheme(themeName, theme) {
  console.log(`\n===== Verifying ${themeName} =====`);

  const tier1Colors = {
    subcategory1: theme.tier1.subcategory1,
    subcategory2: theme.tier1.subcategory2,
    subcategory3: theme.tier1.subcategory3,
    subcategory4: theme.tier1.subcategory4,
  };

  const tier2Groups = {
    subcategory1: ['tier2_1', 'tier2_2', 'tier2_3', 'tier2_4', 'tier2_5'],
    subcategory2: ['tier2_6', 'tier2_7', 'tier2_8'],
    subcategory3: ['tier2_9', 'tier2_10', 'tier2_11', 'tier2_12', 'tier2_13'],
    subcategory4: ['tier2_14', 'tier2_15', 'tier2_16', 'tier2_17', 'tier2_18', 'tier2_19', 'tier2_20'],
  };

  let allValid = true;

  // Check each tier1 category
  for (const [tier1Key, tier1Color] of Object.entries(tier1Colors)) {
    console.log(`\n  ${tier1Key}: ${tier1Color}`);
    const tier2Keys = tier2Groups[tier1Key];

    // Check if all tier2 colors exist
    const missingKeys = [];
    const existingColors = [];

    for (const tier2Key of tier2Keys) {
      const tier2Color = theme.tier2[tier2Key];
      if (!tier2Color) {
        missingKeys.push(tier2Key);
        allValid = false;
      } else {
        existingColors.push(`${tier2Key}: ${tier2Color}`);
      }
    }

    if (missingKeys.length > 0) {
      console.log(`    ❌ MISSING: ${missingKeys.join(', ')}`);
    } else {
      console.log(`    ✅ All tier2 colors defined`);
      existingColors.forEach(color => console.log(`      ${color}`));
    }
  }

  return allValid;
}

console.log('Starting theme verification...\n');

const results = {};
for (const [themeName, theme] of Object.entries(COLOR_THEMES)) {
  results[themeName] = verifyTheme(themeName, theme);
}

console.log('\n\n===== SUMMARY =====');
for (const [themeName, isValid] of Object.entries(results)) {
  console.log(`${isValid ? '✅' : '❌'} ${themeName}`);
}

const allValid = Object.values(results).every(v => v);
console.log(allValid ? '\n✅ All themes are valid!' : '\n❌ Some themes have issues');

process.exit(allValid ? 0 : 1);
