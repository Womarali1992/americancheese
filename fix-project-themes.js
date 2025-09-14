import fetch from 'node-fetch';

// Theme mapping based on presets
const presetThemes = {
  'workout': 'neon-noir',
  'software-development': 'futuristic',
  'home-builder': 'earth-tone',
  'standard-construction': 'classic-construction'
};

async function fixProjectThemes() {
  try {
    // Get all projects
    const response = await fetch('http://localhost:5000/api/projects');
    const projects = await response.json();
    console.log(`Found ${projects.length} projects`);

    for (const project of projects) {
      const expectedTheme = presetThemes[project.presetId];

      if (!expectedTheme) {
        console.log(`⚠️ Project ${project.name} has unknown preset: ${project.presetId}`);
        continue;
      }

      if (project.colorTheme !== expectedTheme) {
        console.log(`🔧 Fixing theme for ${project.name}: ${project.colorTheme} → ${expectedTheme}`);

        const updateResponse = await fetch(`http://localhost:5000/api/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colorTheme: expectedTheme,
            useGlobalTheme: false
          })
        });

        if (updateResponse.ok) {
          console.log(`✅ Updated ${project.name} theme to ${expectedTheme}`);
        } else {
          console.error(`❌ Failed to update ${project.name} theme`);
        }
      } else {
        console.log(`✅ Project ${project.name} already has correct theme: ${expectedTheme}`);
      }
    }
  } catch (error) {
    console.error('Error fixing project themes:', error);
  }
}

fixProjectThemes();