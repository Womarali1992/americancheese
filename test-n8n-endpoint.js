/**
 * Test script for n8n materials import endpoint
 * Run this script to test the n8n integration endpoint
 */
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const PROJECT_ID = 1; // Use an existing project ID from the database

// Sample materials data that matches the n8n webhook format
const testMaterials = [
  {
    name: "Test Material from n8n - 2x4 Lumber",
    quantity: 50,
    unit: "pieces",
    cost: 8.50,
    type: "Building Materials",
    category: "Dimensional Lumber",
    tier: "structural",
    tier2Category: "framing",
    section: "TEST SECTION",
    subsection: "TEST SECTION - FRAMING",
    supplier: "Test Supplier Co.",
    supplierId: null,
    status: "quoted",
    isQuote: true,
    taskIds: [],
    contactIds: [],
    details: "Test material imported from n8n workflow",
    quoteDate: "2024-12-01",
    quoteNumber: "TEST-QUOTE-001"
  },
  {
    name: "Test Material from n8n - Concrete Mix",
    quantity: 25,
    unit: "bags",
    cost: 12.75,
    type: "Building Materials",
    category: "Concrete",
    tier: "structural",
    tier2Category: "foundation",
    section: "TEST SECTION",
    subsection: "TEST SECTION - FOUNDATION",
    supplier: "Concrete Supply Inc.",
    supplierId: null,
    status: "ordered",
    isQuote: false,
    taskIds: [],
    contactIds: [],
    details: "Another test material from n8n",
    orderDate: "2024-12-02"
  },
  {
    name: "Test Material from n8n - Electrical Wire",
    quantity: 100,
    unit: "feet",
    cost: 0.85,
    type: "Building Materials",
    category: "Electrical",
    tier: "systems",
    tier2Category: "electrical",
    section: "TEST SECTION",
    subsection: "TEST SECTION - ELECTRICAL",
    supplier: "Electrical Supply Co.",
    supplierId: null,
    status: "delivered",
    isQuote: false,
    taskIds: [],
    contactIds: []
  }
];

async function testN8nEndpoint() {
  try {
    console.log('Testing n8n materials import endpoint...');
    console.log(`Sending ${testMaterials.length} test materials to project ${PROJECT_ID}`);

    const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/materials/import-n8n`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMaterials)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Success!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Error:', response.status, response.statusText);
      console.log('Error details:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);

    // Check if server is running
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running on port 5000');
      console.log('   Run: npm run dev (or however you start your server)');
    }
  }
}

// Test with invalid data format
async function testInvalidFormat() {
  try {
    console.log('\nTesting invalid data format...');

    const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/materials/import-n8n`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invalid: 'format' })
    });

    const result = await response.json();

    if (response.status === 400) {
      console.log('✅ Validation working correctly - rejected invalid format');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Unexpected response:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Test with invalid project ID
async function testInvalidProject() {
  try {
    console.log('\nTesting invalid project ID...');

    const response = await fetch(`${BASE_URL}/api/projects/99999/materials/import-n8n`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMaterials)
    });

    const result = await response.json();

    if (response.status === 404) {
      console.log('✅ Project validation working correctly - rejected invalid project');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Unexpected response:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testN8nEndpoint();
  await testInvalidFormat();
  await testInvalidProject();

  console.log('\n🎉 Test suite completed!');
  console.log('\n📖 n8n Integration Usage:');
  console.log('1. In your n8n workflow, use an HTTP Request node');
  console.log(`2. Set URL to: ${BASE_URL}/api/projects/YOUR_PROJECT_ID/materials/import-n8n`);
  console.log('3. Set Method to: POST');
  console.log('4. Set Body Content Type to: JSON');
  console.log('5. Send materials data as an array in the request body');
  console.log('\n📄 Example n8n data format:');
  console.log(JSON.stringify(testMaterials.slice(0, 1), null, 2));
}

runAllTests();
