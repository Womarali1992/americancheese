import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve('./client/src/components/project/ResourcesTab.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find all MaterialCard components and fix their indentation
const cardPattern = /(\s+)<MaterialCard\s+\n\1  key=\{material\.id\}\n\1  material=\{material\}\n\1  onEdit=\{\(mat\) => \{\n\1    setSelectedMaterial\(mat\);\n\1    setEditDialogOpen\(true\);\n\1  \}\}\n\1  onDelete=\{\(materialId\) => \{\n\1    if \(window\.confirm\(\`Are you sure you want to delete this material\?\`\)\) \{\n\1      deleteMaterialMutation\.mutate\(materialId\);\n\1    \}\n\1  \}\}\n\1\/>/g;

// Replace with properly indented version
content = content.replace(cardPattern, (match, indent) => {
  return `${indent}<MaterialCard
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
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content);
console.log('Indentation fixed');