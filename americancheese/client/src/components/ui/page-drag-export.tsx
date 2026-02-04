import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GripVertical, Copy, CheckCircle, FileDown, ChevronDown, Download, FileCode, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Debounce helper
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

export interface ExportSection {
  id: string;
  label: string;
  icon?: React.ReactNode;
  getContent: () => string;
}

interface ExportFileOption {
  label: string;
  format: string;
  icon?: React.ReactNode;
  onExport: () => void;
}

interface PageDragExportProps {
  children: React.ReactNode;
  /** Function that returns the full page content to export when dragged */
  getExportContent: () => string;
  /** Title shown in the drag preview */
  exportTitle?: string;
  /** Optional sections for granular export */
  sections?: ExportSection[];
  /** Optional class name for the wrapper */
  className?: string;
  /** Optional file export options (e.g., XML, CSV) */
  exportFileOptions?: ExportFileOption[];
}

/**
 * Wrapper component that enables dragging page content for export.
 * Supports full page export and individual section export via dropdown.
 */
export function PageDragExport({
  children,
  getExportContent,
  exportTitle = 'Page Content',
  sections = [],
  className = '',
  exportFileOptions = [],
}: PageDragExportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragSuccess, setDragSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { toast } = useToast();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRatiosRef = useRef<Map<string, { ratio: number; top: number }>>(new Map());

  // Debounced function to update active section
  const debouncedSetActiveSection = useMemo(
    () => debounce((sectionId: string | null) => {
      setActiveSection(sectionId);
    }, 100),
    []
  );

  // Set up intersection observer to track visible sections
  useEffect(() => {
    if (sections.length === 0) return;

    const updateActiveSection = () => {
      const ratios = sectionRatiosRef.current;

      // Find visible sections (ratio > 0.1)
      const visibleSections: { id: string; ratio: number; top: number }[] = [];
      ratios.forEach((data, id) => {
        if (data.ratio > 0.1) {
          visibleSections.push({ id, ...data });
        }
      });

      if (visibleSections.length === 0) return;

      // Sort by top position (topmost section first)
      visibleSections.sort((a, b) => a.top - b.top);

      // Pick the topmost section that has decent visibility
      // Prefer sections in the top half of viewport
      const topSection = visibleSections.find(s => s.ratio >= 0.2) || visibleSections[0];

      if (topSection) {
        debouncedSetActiveSection(topSection.id);
      }
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      // Update ratios map with current entry data
      entries.forEach((entry) => {
        const sectionId = entry.target.getAttribute('data-export-section');
        if (sectionId) {
          if (entry.isIntersecting) {
            sectionRatiosRef.current.set(sectionId, {
              ratio: entry.intersectionRatio,
              top: entry.boundingClientRect.top,
            });
          } else {
            sectionRatiosRef.current.delete(sectionId);
          }
        }
      });

      updateActiveSection();
    };

    // Delay observer setup to ensure DOM elements are rendered
    const setupObserver = () => {
      observerRef.current = new IntersectionObserver(handleIntersection, {
        threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.75, 1],
        rootMargin: '-60px 0px -30% 0px', // Focus on upper portion of viewport
      });

      // Observe all section elements
      let observedCount = 0;
      sections.forEach((section) => {
        const element = document.querySelector(`[data-export-section="${section.id}"]`);
        if (element) {
          observerRef.current?.observe(element);
          observedCount++;
        }
      });

      // If not all elements found, retry after a short delay
      if (observedCount < sections.length) {
        setTimeout(() => {
          sections.forEach((section) => {
            const element = document.querySelector(`[data-export-section="${section.id}"]`);
            if (element && observerRef.current) {
              observerRef.current.observe(element);
            }
          });
        }, 500);
      }
    };

    // Use requestAnimationFrame to wait for DOM render
    requestAnimationFrame(() => {
      requestAnimationFrame(setupObserver);
    });

    return () => {
      observerRef.current?.disconnect();
      sectionRatiosRef.current.clear();
    };
  }, [sections, debouncedSetActiveSection]);

  const createDragHandler = useCallback((content: string, title: string) => {
    return (e: React.DragEvent) => {
      setIsDragging(true);

      // Clear and set drag data
      e.dataTransfer.clearData();
      e.dataTransfer.setData('text/plain', content);
      e.dataTransfer.setData('text/html', `<div style="white-space: pre-wrap; font-family: monospace;">${content.replace(/\n/g, '<br>').replace(/  /g, '&nbsp;&nbsp;')}</div>`);
      e.dataTransfer.effectAllowed = 'copy';

      // Custom drag image
      const dragImage = document.createElement('div');
      const contentPreview = content.substring(0, 150) + (content.length > 150 ? '...' : '');
      const lineCount = content.split('\n').length;
      dragImage.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="background: #8b5cf6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">EXPORT</div>
          <div style="font-weight: 600;">${title}</div>
        </div>
        <div style="color: #6b7280; font-size: 11px; margin-bottom: 4px;">${lineCount} lines</div>
        <div style="color: #6b7280; font-size: 12px; max-width: 300px; word-wrap: break-word; white-space: pre-wrap;">${contentPreview}</div>
      `;
      dragImage.style.cssText = 'position: absolute; top: -2000px; left: -2000px; background: white; padding: 16px; border: 2px solid #8b5cf6; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.2); z-index: 9999; font-family: system-ui, -apple-system, sans-serif; max-width: 400px; color: #374151;';
      document.body.appendChild(dragImage);

      try {
        e.dataTransfer.setDragImage(dragImage, 30, 20);
      } catch (error) {
        console.warn('Could not set custom drag image:', error);
      }

      // Cleanup and success handling
      const cleanup = () => {
        try {
          if (document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
          }
        } catch (error) {
          console.warn('Error cleaning up drag image:', error);
        }
      };

      const handleDragEnd = () => {
        cleanup();
        setIsDragging(false);
        setDragSuccess(true);

        toast({
          title: "Content Copied",
          description: `"${title}" ready to paste in external applications.`,
          duration: 3000,
        });

        setTimeout(() => setDragSuccess(false), 2000);
        document.removeEventListener('dragend', handleDragEnd);
      };

      setTimeout(cleanup, 100);
      document.addEventListener('dragend', handleDragEnd);
    };
  }, [toast]);

  const handleCopyToClipboard = useCallback(async (content: string, title: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setDragSuccess(true);
      toast({
        title: "Copied to Clipboard",
        description: `"${title}" copied successfully.`,
        duration: 3000,
      });
      setTimeout(() => setDragSuccess(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard. Try dragging instead.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Get active section info
  const activeSectionInfo = sections.find(s => s.id === activeSection);
  const displayLabel = activeSectionInfo ? activeSectionInfo.label : 'Full Page';
  const displayContent = activeSectionInfo ? activeSectionInfo.getContent() : getExportContent();

  return (
    <div className={`relative ${className}`}>
      {/* Fixed export controls in top-right corner */}
      <div
        className={`fixed top-20 right-4 z-40 flex items-center gap-1 transition-all duration-200 ${
          isDragging ? 'ring-2 ring-purple-500 ring-offset-2 rounded-lg' : ''
        } ${dragSuccess ? 'ring-2 ring-green-500 ring-offset-2 rounded-lg' : ''}`}
      >
        {/* Main drag handle - shows current/active section */}
        <div
          draggable={true}
          onDragStart={createDragHandler(displayContent, displayLabel)}
          className={`flex items-center gap-2 bg-white border-2 ${
            isDragging ? 'border-purple-500 bg-purple-50' :
            dragSuccess ? 'border-green-500 bg-green-50' :
            'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
          } rounded-l-lg px-3 py-2 cursor-grab active:cursor-grabbing shadow-lg transition-all duration-200`}
          title={`Drag to export: ${displayLabel}`}
        >
          {dragSuccess ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <FileDown className="h-4 w-4 text-purple-600" />
          )}
          <GripVertical className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
            {dragSuccess ? 'Copied!' : displayLabel}
          </span>
        </div>

        {/* Dropdown for section selection */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-none border-l-0 border-2 px-2 h-[42px] ${
                isDragging ? 'border-purple-500 bg-purple-50' :
                dragSuccess ? 'border-green-500 bg-green-50' :
                'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
              }`}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => handleCopyToClipboard(getExportContent(), 'Full Page')}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Full Page</span>
              <Copy className="h-3 w-3 ml-auto text-gray-400" />
            </DropdownMenuItem>

            {sections.length > 0 && <DropdownMenuSeparator />}

            {sections.map((section) => (
              <DropdownMenuItem
                key={section.id}
                onClick={() => handleCopyToClipboard(section.getContent(), section.label)}
                className={`flex items-center gap-2 ${activeSection === section.id ? 'bg-purple-50' : ''}`}
              >
                {section.icon || <FileDown className="h-4 w-4 text-gray-400" />}
                <span>{section.label}</span>
                {activeSection === section.id && (
                  <span className="text-xs text-purple-600 ml-auto">visible</span>
                )}
                <Copy className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
            ))}

            {exportFileOptions.length > 0 && <DropdownMenuSeparator />}

            {exportFileOptions.map((option, index) => (
              <DropdownMenuItem
                key={`export-${index}`}
                onClick={option.onExport}
                className="flex items-center gap-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900"
              >
                {option.icon || <Download className="h-4 w-4" />}
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-emerald-600 ml-auto">{option.format}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick copy button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCopyToClipboard(displayContent, displayLabel)}
          className={`rounded-r-lg rounded-l-none border-l-0 border-2 h-[42px] ${
            dragSuccess ? 'border-green-500 text-green-600 bg-green-50' :
            'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
          }`}
          title="Copy to clipboard"
        >
          {dragSuccess ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Draggable overlay indicator */}
      {isDragging && (
        <div className="fixed inset-0 bg-purple-500/5 border-4 border-dashed border-purple-300 pointer-events-none z-30 rounded-lg" />
      )}

      {/* Page content */}
      {children}
    </div>
  );
}

/**
 * Wrapper component to mark a section as exportable.
 * Wrap your section content with this to enable section-specific export.
 */
export function ExportableSection({
  id,
  children,
  className = '',
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-export-section={id} className={className}>
      {children}
    </div>
  );
}
