import React from 'react'
import { EnhancedSelect, EnhancedSelectContent, EnhancedSelectItem, EnhancedSelectTrigger, EnhancedSelectValue, EnhancedSelectRichTrigger } from './enhanced-select'
import { Home, Settings, Briefcase } from 'lucide-react'

// Example usage of the enhanced dropdown components

export function DropdownExample() {
  return (
    <div className="space-y-6 p-6">
      <h3 className="text-lg font-medium text-slate-900">Enhanced Dropdown Examples</h3>

      {/* Modern variant of basic select */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Basic Modern Select</label>
        <EnhancedSelect>
          <EnhancedSelectTrigger variant="modern" className="w-full">
            <EnhancedSelectValue placeholder="Select an option" />
          </EnhancedSelectTrigger>
          <EnhancedSelectContent>
            <EnhancedSelectItem value="option1">Option 1</EnhancedSelectItem>
            <EnhancedSelectItem value="option2">Option 2</EnhancedSelectItem>
            <EnhancedSelectItem value="option3">Option 3</EnhancedSelectItem>
          </EnhancedSelectContent>
        </EnhancedSelect>
      </div>

      {/* Compact rich content dropdown - just title */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Compact Rich Content Select (Just Title)</label>
        <EnhancedSelect>
          <EnhancedSelectRichTrigger
            title="Home Builder"
            subtitle="Comprehensive home building preset with permitting, structural, systems, and finishings phases"
            icon={<Home className="h-5 w-5" />}
            // showSubtitle defaults to false for compact layout
          />
          <EnhancedSelectContent>
            <EnhancedSelectItem value="home-builder">Home Builder</EnhancedSelectItem>
            <EnhancedSelectItem value="commercial">Commercial Builder</EnhancedSelectItem>
            <EnhancedSelectItem value="renovation">Renovation Specialist</EnhancedSelectItem>
          </EnhancedSelectContent>
        </EnhancedSelect>
      </div>

      {/* Rich content dropdown with subtitle enabled */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Rich Content Select (With Subtitle)</label>
        <EnhancedSelect>
          <EnhancedSelectRichTrigger
            title="Home Builder"
            subtitle="Comprehensive home building preset"
            icon={<Home className="h-5 w-5" />}
            showSubtitle={true} // Enable subtitle display
          />
          <EnhancedSelectContent>
            <EnhancedSelectItem value="home-builder">
              <div className="flex flex-col">
                <span className="font-medium">Home Builder</span>
                <span className="text-xs text-slate-500">Comprehensive home building preset</span>
              </div>
            </EnhancedSelectItem>
            <EnhancedSelectItem value="commercial">
              <div className="flex flex-col">
                <span className="font-medium">Commercial Builder</span>
                <span className="text-xs text-slate-500">Office and retail construction</span>
              </div>
            </EnhancedSelectItem>
            <EnhancedSelectItem value="renovation">
              <div className="flex flex-col">
                <span className="font-medium">Renovation Specialist</span>
                <span className="text-xs text-slate-500">Home improvement and remodeling</span>
              </div>
            </EnhancedSelectItem>
          </EnhancedSelectContent>
        </EnhancedSelect>
      </div>

      {/* Comparison: Your original vs Enhanced */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-slate-800">Comparison</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Your Original</label>
            <button
              type="button"
              role="combobox"
              aria-controls="radix-:rv:"
              aria-expanded="false"
              aria-autocomplete="none"
              dir="ltr"
              data-state="closed"
              className="flex h-10 items-center justify-between bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
              id=":ru:-form-item"
              aria-describedby=":ru:-form-item-description"
              aria-invalid="false"
            >
              <span style={{pointerEvents: 'none'}}>
                <div className="flex flex-col">
                  <span className="font-medium">Home Builder</span>
                  <span className="text-xs text-slate-500">Comprehensive home building preset with permitting, structural, systems, and finishings phases</span>
                </div>
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down h-4 w-4 opacity-50" aria-hidden="true">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Enhanced Compact Version</label>
            <EnhancedSelect>
              <EnhancedSelectRichTrigger
                title="Home Builder"
                subtitle="Comprehensive home building preset with permitting, structural, systems, and finishings phases"
                icon={<Home className="h-5 w-5" />}
                // Compact layout - just shows title by default
              />
              <EnhancedSelectContent>
                <EnhancedSelectItem value="home-builder">Home Builder</EnhancedSelectItem>
                <EnhancedSelectItem value="commercial">Commercial Builder</EnhancedSelectItem>
                <EnhancedSelectItem value="renovation">Renovation Specialist</EnhancedSelectItem>
              </EnhancedSelectContent>
            </EnhancedSelect>
          </div>
        </div>
      </div>
    </div>
  )
}
