/**
 * Script to import materials from Final_Material_Data.csv into the database
 */
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { db } from './server/db.js';
import { materials } from './shared/schema.js';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to import materials from CSV
async function importMaterials() {
  try {
    console.log('Starting materials import...');
    
    // Check if projects exist
    const projects = await db.query.projects.findMany();
    if (projects.length === 0) {
      console.error('No projects found in the database. Please create a project first.');
      return;
    }
    
    // Use the first project as the default
    const defaultProjectId = projects[0].id;
    console.log(`Using project ID ${defaultProjectId} (${projects[0].name}) as the default project`);
    
    // Read the CSV file
    const csvFilePath = path.join(__dirname, 'attached_assets', 'Final_Material_Data.csv');
    if (!fs.existsSync(csvFilePath)) {
      console.error('CSV file not found:', csvFilePath);
      return;
    }
    
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const stream = Readable.from(csvData);
    
    const results = [];
    let importedCount = 0;
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (data) => {
          // Add each row to our results array
          results.push(data);
        })
        .on('end', async () => {
          console.log(`Parsed ${results.length} materials from CSV`);
          
          // Process each row and create materials
          for (const row of results) {
            try {
              // Extract field data
              const materialName = row['Material Name'] || '';
              const quantity = parseInt(row['Quantity']) || 0;
              const unit = row['Unit'] || 'pieces';
              const cost = parseFloat(row['Cost per Unit']) || 0;
              
              // Determine type and category
              const type = row['Material Type'] || row['Type'] || 'Building Materials';
              const category = row['Material Category'] || row['Category'] || 'other';
              
              // Determine tier and tier2 categories based on Type/Category fields
              let tier = 'structural';
              let tier2Category = null;
              
              // Map Type field to tier and tier2Category
              if (type.toLowerCase().includes('lumber') || 
                  type.toLowerCase().includes('frame') || 
                  type.toLowerCase().includes('framing')) {
                tier = 'structural';
                tier2Category = 'framing';
              } else if (type.toLowerCase().includes('foundation')) {
                tier = 'structural';
                tier2Category = 'foundation';
              } else if (type.toLowerCase().includes('roof') || 
                         type.toLowerCase().includes('shingle')) {
                tier = 'structural';
                tier2Category = 'roofing';
              } else if (type.toLowerCase().includes('electric')) {
                tier = 'systems';
                tier2Category = 'electrical';
              } else if (type.toLowerCase().includes('plumb')) {
                tier = 'systems';
                tier2Category = 'plumbing';
              } else if (type.toLowerCase().includes('hvac')) {
                tier = 'systems';
                tier2Category = 'hvac';
              } else if (type.toLowerCase().includes('drywall') || 
                         type.toLowerCase().includes('insulation')) {
                tier = 'sheathing';
                tier2Category = category.toLowerCase().includes('drywall') ? 'drywall' : 'insulation';
              } else if (type.toLowerCase().includes('siding') || 
                         type.toLowerCase().includes('exterior')) {
                tier = 'sheathing';
                tier2Category = 'siding';
              } else if (type.toLowerCase().includes('floor')) {
                tier = 'finishings';
                tier2Category = 'flooring';
              } else if (type.toLowerCase().includes('paint')) {
                tier = 'finishings';
                tier2Category = 'paint';
              } else if (type.toLowerCase().includes('cabinet')) {
                tier = 'finishings';
                tier2Category = 'cabinets';
              } else if (type.toLowerCase().includes('door')) {
                tier = 'finishings';
                tier2Category = 'doors';
              } else if (type.toLowerCase().includes('window')) {
                tier = 'finishings';
                tier2Category = 'windows';
              }
              
              // Determine section based on material name (any text before the first hyphen)
              const sectionMatch = materialName.match(/^([^-]+)/);
              const section = sectionMatch ? sectionMatch[1].trim() : null;
              
              // Determine subsection based on material name (text between first and second hyphen)
              const subsectionMatch = materialName.match(/^[^-]+-\s*([^-]+)/);
              const subsection = subsectionMatch ? subsectionMatch[1].trim() : null;
              
              // Create the material record
              const material = {
                name: materialName,
                type: type,
                category: category,
                tier: tier,
                tier2Category: tier2Category,
                section: section,
                subsection: subsection,
                quantity: quantity,
                unit: unit,
                cost: cost,
                status: 'ordered',
                projectId: defaultProjectId,
                taskIds: [],
                contactIds: []
              };
              
              // Insert into database
              await db.insert(materials).values(material);
              importedCount++;
              
              if (importedCount % 10 === 0) {
                console.log(`Imported ${importedCount} materials so far...`);
              }
            } catch (error) {
              console.error(`Error importing material "${row['Material Name']}":`, error);
            }
          }
          
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });
    
    console.log(`Import completed. Successfully imported ${importedCount} materials.`);
  } catch (error) {
    console.error('Error importing materials:', error);
  }
}

// Run the import function
importMaterials().then(() => {
  console.log('Script execution completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});