/**
 * Script to restore sample projects for testing persistent selection
 */

const sampleProjects = [
  {
    name: "Oakwood Residential Complex",
    location: "456 Maple Avenue, Springfield",
    description: "Multi-unit residential construction with modern amenities",
    startDate: "2025-02-01",
    endDate: "2025-11-30",
    status: "active",
    progress: 15
  },
  {
    name: "Downtown Office Tower",
    location: "789 Business District, Metro City",
    description: "20-story commercial office building with retail ground floor",
    startDate: "2025-01-15",
    endDate: "2026-06-15",
    status: "active", 
    progress: 8
  },
  {
    name: "Green Valley Community Center",
    location: "321 Community Way, Green Valley",
    description: "Public community facility with gymnasium and meeting spaces",
    startDate: "2025-03-01",
    endDate: "2025-12-15",
    status: "planning",
    progress: 0
  },
  {
    name: "Riverside Shopping Plaza",
    location: "654 River Road, Riverside",
    description: "Retail shopping center with parking and landscaping",
    startDate: "2024-08-01",
    endDate: "2025-05-30",
    status: "active",
    progress: 75
  }
];

async function createSampleProjects() {
  console.log('Creating sample projects for testing...');
  
  for (const projectData of sampleProjects) {
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-token=cm-app-auth-token-123456'
        },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        const project = await response.json();
        console.log(`✓ Created: ${project.name} (ID: ${project.id})`);
      } else {
        console.error(`✗ Failed to create ${projectData.name}:`, await response.text());
      }
    } catch (error) {
      console.error(`✗ Error creating ${projectData.name}:`, error.message);
    }
  }
  
  console.log('\nSample project creation complete!');
}

createSampleProjects();