/**
 * Script to create sample quote materials linked to suppliers
 * This will ensure that quotes show up properly in the supplier views
 */

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createSupplierQuotes() {
  try {
    console.log('Creating sample supplier quotes...');
    
    // Get all supplier contacts
    const suppliersResult = await pool.query('SELECT * FROM contacts WHERE type = $1', ['supplier']);
    const suppliers = suppliersResult.rows;
    
    if (suppliers.length === 0) {
      console.log('No suppliers found in the database. Please create suppliers first.');
      return;
    }
    
    console.log(`Found ${suppliers.length} suppliers`);
    
    // Get all projects to associate quotes with
    const projectsResult = await pool.query('SELECT * FROM projects');
    const projects = projectsResult.rows;
    
    if (projects.length === 0) {
      console.log('No projects found in the database. Please create projects first.');
      return;
    }
    
    // Create sample quotes for each supplier
    for (const supplier of suppliers) {
      console.log(`Creating quotes for supplier: ${supplier.name} (ID: ${supplier.id})`);
      
      // Create 2 quotes per supplier
      for (let i = 1; i <= 2; i++) {
        const projectId = projects[0].id; // Use the first project
        const quoteNumber = `Q-${supplier.id}-${Date.now().toString().substring(8)}-${i}`;
        const quoteDate = new Date().toISOString().split('T')[0];
        
        // Create the quote as a material
        const quoteResult = await pool.query(
          `INSERT INTO materials (
            name, 
            type, 
            category, 
            quantity, 
            supplier, 
            supplier_id, 
            status, 
            is_quote, 
            project_id, 
            quote_date, 
            quote_number,
            cost,
            tier,
            tier2category,
            unit
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`, 
          [
            `${supplier.name} Quote ${i}`, // name
            'Building Materials', // type
            'Lumber & Composites', // category
            i * 10, // quantity
            supplier.name, // supplier name
            supplier.id, // supplier_id
            'quoted', // status
            true, // is_quote
            projectId, // project_id
            quoteDate, // quote_date
            quoteNumber, // quote_number
            i * 25, // cost
            'structural', // tier
            'Lumber', // tier2category
            'pieces' // unit
          ]
        );
        
        console.log(`Created quote ${i} for supplier ${supplier.name}: ID ${quoteResult.rows[0].id}`);
      }
    }
    
    console.log('Sample supplier quotes created successfully!');
  } catch (error) {
    console.error('Error creating supplier quotes:', error);
  } finally {
    await pool.end();
  }
}

createSupplierQuotes().catch(console.error);