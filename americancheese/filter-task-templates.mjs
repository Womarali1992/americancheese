import fs from 'fs';

// Valid tier1 categories from our current presets
const validTier1Categories = [
  'Permitting',
  'Structural',
  'Systems',
  'Finishings',
  'Sheathing',
  'Software Engineering',
  'Product Management',
  'Design / UX',
  'Marketing / Go-to-Market (GTM)',
  'Push',
  'Pull',
  'Legs',
  'Cardio'
];

// Read the current taskTemplates.ts file
const filePath = './shared/taskTemplates.ts';
const content = fs.readFileSync(filePath, 'utf8');

console.log('Filtering task templates to only include valid categories...');

// Split content into lines for processing
const lines = content.split('\n');
const filteredLines = [];
let insideTaskObject = false;
let currentTaskValid = false;
let taskBuffer = [];
let bracketDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Check if we're starting a new task object
  if (line.trim().startsWith('{') && !insideTaskObject) {
    insideTaskObject = true;
    taskBuffer = [line];
    bracketDepth = 1;
    currentTaskValid = false;
    continue;
  }

  // If we're inside a task object
  if (insideTaskObject) {
    taskBuffer.push(line);

    // Count brackets to know when we're done with this task
    const openBrackets = (line.match(/\{/g) || []).length;
    const closeBrackets = (line.match(/\}/g) || []).length;
    bracketDepth += openBrackets - closeBrackets;

    // Check if this line contains a valid tier1Category
    const tier1Match = line.match(/tier1Category:\s*"([^"]*)"/);
    if (tier1Match) {
      const tier1Category = tier1Match[1];
      currentTaskValid = validTier1Categories.includes(tier1Category);
      console.log(`Found task with tier1Category: "${tier1Category}" - ${currentTaskValid ? 'KEEPING' : 'REMOVING'}`);
    }

    // If we've closed all brackets, we're done with this task
    if (bracketDepth === 0) {
      if (currentTaskValid) {
        filteredLines.push(...taskBuffer);
      }
      insideTaskObject = false;
      taskBuffer = [];
    }
  } else {
    // If we're not inside a task object, keep the line as-is
    filteredLines.push(line);
  }
}

// Write the filtered content back to the file
const filteredContent = filteredLines.join('\n');
fs.writeFileSync(filePath, filteredContent);

console.log('\\nTask templates filtered successfully!');
console.log(`Original file backed up as: ${filePath}.backup`);

// Count remaining tasks
const remainingTasks = (filteredContent.match(/tier1Category:/g) || []).length;
console.log(`Remaining tasks: ${remainingTasks}`);