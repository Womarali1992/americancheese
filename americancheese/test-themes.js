import { COLOR_THEMES } from './client/src/lib/color-themes.ts';

console.log('Available themes:', Object.keys(COLOR_THEMES));
console.log('\nDust Planet theme:');
const dustPlanet = COLOR_THEMES['dust-planet'];
if (dustPlanet) {
  console.log('  Name:', dustPlanet.name);
  console.log('  Tier1 colors:');
  console.log('    subcategory1 (structural):', dustPlanet.tier1.subcategory1);
  console.log('    subcategory2 (systems):', dustPlanet.tier1.subcategory2);
  console.log('    subcategory3 (sheathing):', dustPlanet.tier1.subcategory3);
  console.log('    subcategory4 (finishings):', dustPlanet.tier1.subcategory4);
} else {
  console.log('  NOT FOUND!');
}
