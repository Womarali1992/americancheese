import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve('./client/src/components/project/ResourcesTab.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Define the card pattern to look for
const cardPattern = /<Card key=\{material\.id\}>[\s\S]+?<\/Card>/g;

// Count occurrences before replacement
const matches = content.match(cardPattern);

// Get each match and create a properly indented replacement
const replacements = [];
if (matches) {
  matches.forEach(match => {
    // Count the indent level from the match
    const lines = match.split('\n');
    const firstLine = lines[0];
    const indent = firstLine.match(/^\s*/)[0];
    
    // Create a properly indented replacement
    const indentedReplacement = `${indent}<MaterialCard 
${indent}  key={material.id}
${indent}  material={material}
${indent}  onEdit={(mat) => {
${indent}    setSelectedMaterial(mat);
${indent}    setEditDialogOpen(true);
${indent}  }}
${indent}  onDelete={(materialId) => {
${indent}    if (window.confirm(\`Are you sure you want to delete this material?\`)) {
${indent}      deleteMaterialMutation.mutate(materialId);
${indent}    }
${indent}  }}
${indent}/>`;
    
    replacements.push({
      original: match,
      replacement: indentedReplacement
    });
  });

  // Apply each replacement individually
  replacements.forEach(({ original, replacement }) => {
    content = content.replace(original, replacement);
  });
}
if (matches) {
  console.log(`Found ${matches.length} card instances in ResourcesTab.tsx`);
} else {
  console.log('No card instances found');
  process.exit(1);
}

// Write the updated content back to the file
fs.writeFileSync(filePath, content);
console.log('Replacements complete');