/**
 * Script to restore user's actual data from CSV files
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function importMaterials() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const csvFilePath = path.join(__dirname, 'attached_assets', 'Final_Material_Data.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      console.error('Materials CSV file not found:', csvFilePath);
      return;
    }
    
    const materials = [];
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    
    return new Promise((resolve, reject) => {
      const stream = require('stream').Readable.from(csvData);
      
      stream
        .pipe(csvParser())
        .on('data', (row) => {
          // Map CSV columns to database schema
          const material = {
            name: row['Material Name'] || '',
            quantity: parseInt(row['Quantity']) || 0,
            unit: row['Unit'] || 'pieces',
            cost: parseFloat(row['Cost per Unit']) || 0,
            type: row['Type'] || 'other',
            category: row['Category'] || 'other',
            tier: (row['Type'] || '').toLowerCase() === 'structural' ? 'structural' : 
                  (row['Type'] || '').toLowerCase() === 'systems' ? 'systems' :
                  (row['Type'] || '').toLowerCase() === 'sheathing' ? 'sheathing' :
                  (row['Type'] || '').toLowerCase() === 'finishings' ? 'finishings' : 'structural',
            tier2Category: row['Category'] || 'other',
            status: 'ordered',
            isQuote: false,
            projectId: 1 // Downtown Office Building
          };
          
          materials.push(material);
        })
        .on('end', async () => {
          try {
            console.log(`Parsed ${materials.length} materials from CSV`);
            
            // Insert materials into database
            let insertedCount = 0;
            
            for (const material of materials) {
              try {
                const query = `
                  INSERT INTO materials (
                    name, quantity, unit, cost, type, category, tier, 
                    tier2category, status, is_quote, project_id
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `;
                
                await client.query(query, [
                  material.name,
                  material.quantity,
                  material.unit,
                  material.cost,
                  material.type,
                  material.category,
                  material.tier,
                  material.tier2Category,
                  material.status,
                  material.isQuote,
                  material.projectId
                ]);
                
                insertedCount++;
              } catch (insertError) {
                console.error('Error inserting material:', material.name, insertError.message);
              }
            }
            
            console.log(`Successfully imported ${insertedCount} materials`);
            resolve(insertedCount);
          } catch (error) {
            console.error('Error processing materials:', error);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('Error reading CSV:', error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

async function importLabor() {
  try {
    const csvFilePath = path.join(__dirname, 'Updated_Labor_Import_for_David_Estrada_Fixed.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      console.log('Labor CSV file not found, skipping labor import');
      return 0;
    }
    
    const laborEntries = [];
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    
    return new Promise((resolve, reject) => {
      const stream = require('stream').Readable.from(csvData);
      
      stream
        .pipe(csvParser())
        .on('data', (row) => {
          // Map CSV columns to database schema
          const labor = {
            fullName: row['Full Name'] || row['Name'] || '',
            tier1Category: row['Tier 1 Category'] || 'Structural',
            tier2Category: row['Tier 2 Category'] || 'Foundation',
            company: row['Company'] || '',
            phone: row['Phone'] || '',
            email: row['Email'] || '',
            projectId: 1, // Downtown Office Building
            workDate: row['Work Date'] || new Date().toISOString().split('T')[0],
            startDate: row['Start Date'] || row['Work Date'] || new Date().toISOString().split('T')[0],
            endDate: row['End Date'] || row['Work Date'] || new Date().toISOString().split('T')[0],
            laborCost: parseFloat(row['Labor Cost']) || 0,
            totalHours: parseFloat(row['Total Hours']) || 0,
            taskDescription: row['Task Description'] || '',
            areaOfWork: row['Area of Work'] || '',
            status: 'pending',
            isQuote: false
          };
          
          laborEntries.push(labor);
        })
        .on('end', async () => {
          try {
            console.log(`Parsed ${laborEntries.length} labor entries from CSV`);
            
            let insertedCount = 0;
            
            for (const labor of laborEntries) {
              try {
                const query = `
                  INSERT INTO labor (
                    full_name, tier1_category, tier2_category, company, phone, email,
                    project_id, work_date, start_date, end_date, labor_cost, total_hours,
                    task_description, area_of_work, status, is_quote
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                `;
                
                await client.query(query, [
                  labor.fullName,
                  labor.tier1Category,
                  labor.tier2Category,
                  labor.company,
                  labor.phone,
                  labor.email,
                  labor.projectId,
                  labor.workDate,
                  labor.startDate,
                  labor.endDate,
                  labor.laborCost,
                  labor.totalHours,
                  labor.taskDescription,
                  labor.areaOfWork,
                  labor.status,
                  labor.isQuote
                ]);
                
                insertedCount++;
              } catch (insertError) {
                console.error('Error inserting labor entry:', labor.fullName, insertError.message);
              }
            }
            
            console.log(`Successfully imported ${insertedCount} labor entries`);
            resolve(insertedCount);
          } catch (error) {
            console.error('Error processing labor entries:', error);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('Error reading labor CSV:', error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('Error importing labor:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting data restoration...');
    
    const materialsCount = await importMaterials();
    console.log(`Imported ${materialsCount} materials`);
    
    const laborCount = await importLabor();
    console.log(`Imported ${laborCount} labor entries`);
    
    console.log('Data restoration completed successfully');
  } catch (error) {
    console.error('Data restoration failed:', error);
  } finally {
    await client.end();
  }
}

main();