// Debug component to test material creation
// Add this temporarily to your materials page to test the API directly

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DebugMaterialForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testMaterialCreation = async () => {
    setIsLoading(true);
    setResult('Testing...');

    try {
      const testData = {
        name: "Debug Test Material " + new Date().getTime(),
        type: "Building Materials",
        category: "Lumber & Composites",
        tier: "structural",
        tier2Category: "framing", 
        quantity: 1,
        supplier: "Test Supplier",
        status: "ordered",
        projectId: 1, // Assuming project ID 1 exists
        taskIds: [],
        contactIds: [],
        unit: "pieces",
        cost: 10.50,
        details: "Debug test material"
      };

      console.log('Sending test data:', testData);

      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (response.ok) {
        setResult(`✅ SUCCESS: Material created!\nResponse: ${responseText}`);
      } else {
        setResult(`❌ FAILED: Status ${response.status}\nError: ${responseText}`);
      }

    } catch (error) {
      console.error('Test error:', error);
      setResult(`❌ ERROR: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>🔧 Debug Material Creation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testMaterialCreation}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test Material Creation API'}
        </Button>
        
        {result && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}