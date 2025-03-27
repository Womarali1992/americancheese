#!/usr/bin/env node

/**
 * Script to call the reset-task-templates API endpoint
 * This is a one-time utility script for resetting all task templates
 */

const http = require('http');

// Configuration
const AUTH_TOKEN = 'cm-app-auth-token-123456';

// Function to make the API request
function resetTaskTemplates() {
  return new Promise((resolve, reject) => {
    console.log('Sending reset task templates request...');
    
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: '/api/reset-task-templates',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(data);
            console.log('Reset completed successfully!');
            console.log('Response:', parsedData);
            resolve(parsedData);
          } catch (error) {
            console.log('Raw response:', data);
            resolve({ message: 'Reset may have completed but response was not valid JSON' });
          }
        } else {
          console.error(`Error: ${res.statusCode} ${res.statusMessage}`);
          console.error('Response:', data);
          reject(new Error(`Request failed with status code ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error making request:', error.message);
      reject(error);
    });
    
    // Send empty JSON body
    req.write('{}');
    req.end();
  });
}

// Execute the function
async function main() {
  try {
    await resetTaskTemplates();
    console.log('Task templates reset script completed');
  } catch (error) {
    console.error('Script failed:', error.message);
    process.exit(1);
  }
}

main();