import React from 'react';
import { useTaskCardColors } from '@/hooks/useUnifiedColors';

export function ColorTest() {
  const colors = useTaskCardColors('structural', 'foundation', 1);
  
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Color Test</h2>
      
      <div className="space-y-2">
        <div>
          <strong>Primary Color:</strong> 
          <span className="ml-2 px-2 py-1 rounded text-white" style={{ backgroundColor: colors.primaryColor || '#6b7280' }}>
            {colors.primaryColor || 'No color'}
          </span>
        </div>
        
        <div>
          <strong>Tier 1 Color:</strong> 
          <span className="ml-2 px-2 py-1 rounded text-white" style={{ backgroundColor: colors.tier1Color || '#6b7280' }}>
            {colors.tier1Color || 'No color'}
          </span>
        </div>
        
        <div>
          <strong>Tier 2 Color:</strong> 
          <span className="ml-2 px-2 py-1 rounded text-white" style={{ backgroundColor: colors.tier2Color || '#6b7280' }}>
            {colors.tier2Color || 'No color'}
          </span>
        </div>
        
        <div>
          <strong>Loading:</strong> {colors.isLoading ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Error:</strong> {colors.error ? colors.error.message : 'None'}
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold">Test Project Names:</h3>
        <div className="space-y-1">
          <span 
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors.primaryColor ? `text-[${colors.primaryColor}] bg-[${colors.primaryColor}]/10` : 'text-slate-500 bg-slate-100'}`}
          >
            Picklebook
          </span>
          <br />
          <span 
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors.primaryColor ? `text-[${colors.primaryColor}] bg-[${colors.primaryColor}]/10` : 'text-slate-500 bg-slate-100'}`}
          >
            HoustonTexasApartments.com
          </span>
        </div>
      </div>
    </div>
  );
}



