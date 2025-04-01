/**
 * Script to create sample supplier contacts for testing
 */
import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the schema dynamically
const schemaPath = join(__dirname, './shared/schema.js');
const { contacts } = await import(schemaPath);

// Declare the suppliers we want to add
const SUPPLIERS = [
  {
    name: "Northwest Lumber Co.",
    role: "Building Materials",
    company: "Northwest Lumber Co.",
    phone: "555-123-4567",
    email: "sales@northwestlumber.example.com",
    type: "supplier",
    category: "wood",
    initials: "NL",
  },
  {
    name: "Electrical Supply Warehouse",
    role: "Electrical Supplies",
    company: "Electrical Supply Warehouse",
    phone: "555-234-5678",
    email: "orders@esw.example.com",
    type: "supplier",
    category: "electrical",
    initials: "ES",
  },
  {
    name: "Metro Plumbing Supply",
    role: "Plumbing Fixtures",
    company: "Metro Plumbing Supply",
    phone: "555-345-6789",
    email: "contact@metroplumbing.example.com",
    type: "supplier",
    category: "plumbing",
    initials: "MP",
  },
  {
    name: "Superior Roofing Materials",
    role: "Roofing Materials",
    company: "Superior Roofing Materials",
    phone: "555-456-7890",
    email: "info@superiorroof.example.com",
    type: "supplier",
    category: "roofing",
    initials: "SR",
  },
  {
    name: "Modern Flooring Solutions",
    role: "Flooring Products",
    company: "Modern Flooring Solutions",
    phone: "555-567-8901",
    email: "sales@modernfloor.example.com",
    type: "supplier",
    category: "flooring",
    initials: "MF",
  },
  {
    name: "Quality Drywall & Insulation",
    role: "Drywall and Insulation",
    company: "Quality Drywall & Insulation",
    phone: "555-678-9012",
    email: "orders@qdrywall.example.com",
    type: "supplier",
    category: "drywall",
    initials: "QD",
  },
];

async function createSampleSuppliers() {
  try {
    // Connect to the database
    const queryClient = postgres(process.env.DATABASE_URL);
    const db = drizzle(queryClient);
    
    console.log('Connected to database');
    
    // Check for existing suppliers to avoid duplicates
    const existingSuppliers = await db.select().from(contacts).where(eq(contacts.type, 'supplier'));
    console.log(`Found ${existingSuppliers.length} existing suppliers`);
    
    if (existingSuppliers.length >= SUPPLIERS.length) {
      console.log('Suppliers already exist in the database. No need to create more.');
      await queryClient.end();
      return;
    }
    
    // Create new suppliers
    const createdSuppliers = [];
    
    for (const supplier of SUPPLIERS) {
      const exists = existingSuppliers.some(
        s => s.name.toLowerCase() === supplier.name.toLowerCase() ||
             s.email.toLowerCase() === supplier.email.toLowerCase()
      );
      
      if (!exists) {
        const result = await db.insert(contacts).values(supplier).returning();
        createdSuppliers.push(result[0]);
        console.log(`Created supplier: ${supplier.name}`);
      } else {
        console.log(`Supplier ${supplier.name} already exists, skipping`);
      }
    }
    
    console.log(`Successfully created ${createdSuppliers.length} suppliers`);
    
    // Close the database connection
    await queryClient.end();
    
  } catch (error) {
    console.error('Error creating sample suppliers:', error);
  }
}

// Run the function
createSampleSuppliers();