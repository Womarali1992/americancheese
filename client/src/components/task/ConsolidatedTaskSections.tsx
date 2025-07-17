import React, { useState, useEffect } from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clipboard,
  CheckSquare,
  Combine,
  Package,
  Users,
  User,
  Calendar,
  FileText,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  File
} from "lucide-react";
import { Task } from '@shared/schema';
import { SubtaskManager } from './SubtaskManager';
import { TaskChecklistManager } from './TaskChecklistManager';
import { SpecialSectionsManager } from './SpecialSectionsManager';
import { TaskLabor } from './TaskLabor';
import { TaskMaterials } from './TaskMaterials';
import { TaskAttachmentsPanel } from './TaskAttachmentsPanel';
import { formatDate } from '@/lib/utils';
import { format } from 'date-fns';

interface ConsolidatedTaskSectionsProps {
  task: Task;
  onAddMaterials?: () => void;
  onAddLabor?: () => void;
  onAddAttachments?: () => void;
  taskMaterials?: any[];
  taskContacts?: any[];
  projects?: any[];
}

export function ConsolidatedTaskSections({ 
  task, 
  onAddMaterials, 
  onAddLabor, 
  onAddAttachments,
  taskMaterials = [],
  taskContacts = [],
  projects = []
}: ConsolidatedTaskSectionsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const project = projects.find((p: any) => p.id === task.projectId);
  
  // Calculate progress for different sections
  const calculateProgress = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const sections = [
    {
      id: 'overview',
      title: 'Task Overview',
      icon: <FileText className="h-5 w-5" />,
      badge: task.status === 'completed' ? 'Completed' : 'Active',
      badgeVariant: task.status === 'completed' ? 'default' : 'secondary',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{task.startDate ? format(new Date(task.startDate), 'MMM d, yyyy') : 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium">{task.endDate ? format(new Date(task.endDate), 'MMM d, yyyy') : 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <User className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="font-medium">{task.assignedTo || "Unassigned"}</p>
              </div>
            </div>
          </div>
          
          {task.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'subtasks',
      title: 'Task Checklist',
      icon: <Clipboard className="h-5 w-5" />,
      badge: '0/0',
      badgeVariant: 'outline',
      content: <SubtaskManager taskId={task.id} />
    },
    {
      id: 'blockers',
      title: 'Blocker Board',
      icon: <CheckSquare className="h-5 w-5" />,
      badge: '0/0',
      badgeVariant: 'outline',
      content: <TaskChecklistManager taskId={task.id} />
    },
    {
      id: 'special',
      title: 'Special Sections',
      icon: <Combine className="h-5 w-5" />,
      badge: 'Advanced',
      badgeVariant: 'secondary',
      content: <SpecialSectionsManager taskId={task.id} />
    },
    {
      id: 'resources',
      title: 'Resources & Assets',
      icon: <Package className="h-5 w-5" />,
      badge: `${taskMaterials.length + taskContacts.length}`,
      badgeVariant: 'outline',
      content: (
        <div className="space-y-6">
          {/* Materials Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-600" />
                <h4 className="font-medium">Materials</h4>
                <Badge variant="outline">{taskMaterials.length}</Badge>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onAddMaterials}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <TaskMaterials taskId={task.id} />
            </div>
          </div>

          {/* Contacts Section */}
          {taskContacts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">Assigned Contacts</h4>
                <Badge variant="outline">{taskContacts.length}</Badge>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {taskContacts.map((contact: any) => (
                    <div key={contact.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                      <User className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className="text-xs text-gray-600">{contact.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Attachments Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Attachments</h4>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onAddAttachments}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload
              </Button>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <TaskAttachmentsPanel task={task} />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'labor',
      title: 'Labor & Time Tracking',
      icon: <Users className="h-5 w-5" />,
      badge: 'Track',
      badgeVariant: 'outline',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Labor Entries</h4>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onAddLabor}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Labor
            </Button>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <TaskLabor taskId={task.id} mode="full" />
          </div>
        </div>
      )
    }
  ];

  const toggleSection = (sectionId: string) => {
    if (isTransitioning) return; // Prevent rapid transitions
    
    setIsTransitioning(true);
    setActiveTab(sectionId);
    
    // Add smooth transition delay
    setTimeout(() => {
      setExpandedSection(sectionId);
      setTimeout(() => setIsTransitioning(false), 300); // Match CSS transition duration
    }, 150);
  };

  const navigateToNextSection = () => {
    if (!expandedSection || isTransitioning) return;
    
    const currentIndex = sections.findIndex(s => s.id === expandedSection);
    const nextIndex = (currentIndex + 1) % sections.length;
    const nextSection = sections[nextIndex];
    
    toggleSection(nextSection.id);
  };

  const navigateToPreviousSection = () => {
    if (!expandedSection || isTransitioning) return;
    
    const currentIndex = sections.findIndex(s => s.id === expandedSection);
    const prevIndex = (currentIndex - 1 + sections.length) % sections.length;
    const prevSection = sections[prevIndex];
    
    toggleSection(prevSection.id);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!expandedSection) return;
      
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        navigateToNextSection();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        navigateToPreviousSection();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setExpandedSection(null);
        setActiveTab(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [expandedSection]);

  // Mouse wheel navigation with throttling
  useEffect(() => {
    let lastScrollTime = 0;
    const scrollThrottle = 300; // Minimum time between section changes (ms)
    
    const handleWheelScroll = (event: WheelEvent) => {
      if (!expandedSection || isTransitioning) return;
      
      const now = Date.now();
      if (now - lastScrollTime < scrollThrottle) return;
      
      // Check if we're at the top or bottom of the content
      const target = event.target as HTMLElement;
      const scrollContainer = target.closest('.scroll-container') || target.closest('[data-scroll-container]');
      
      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isAtTop = scrollTop === 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // 5px tolerance
        
        if (event.deltaY > 0 && isAtBottom) {
          // Scrolling down at bottom - go to next section
          event.preventDefault();
          lastScrollTime = now;
          navigateToNextSection();
        } else if (event.deltaY < 0 && isAtTop) {
          // Scrolling up at top - go to previous section
          event.preventDefault();
          lastScrollTime = now;
          navigateToPreviousSection();
        }
      } else {
        // If no scroll container, allow section navigation
        if (event.deltaY > 0) {
          event.preventDefault();
          lastScrollTime = now;
          navigateToNextSection();
        } else if (event.deltaY < 0) {
          event.preventDefault();
          lastScrollTime = now;
          navigateToPreviousSection();
        }
      }
    };

    if (expandedSection) {
      window.addEventListener('wheel', handleWheelScroll, { passive: false });
    }
    
    return () => window.removeEventListener('wheel', handleWheelScroll);
  }, [expandedSection, isTransitioning]);

  const getCurrentSectionIndex = () => {
    return sections.findIndex(s => s.id === expandedSection);
  };

  // Touch/swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50; // minimum distance for swipe
    
    if (distance > minSwipeDistance) {
      // Swipe left - next section
      navigateToNextSection();
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous section
      navigateToPreviousSection();
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Desktop: Grid layout for collapsed sections, full width for expanded */}
      <div className="hidden lg:block">
        {/* Show grid only when no section is expanded */}
        {!expandedSection && (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {sections.map((section) => (
              <Card key={section.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200">
                <CardHeader 
                  className="pb-3 hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={section.badgeVariant as any}>
                        {section.badge}
                      </Badge>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
        
        {/* Show full screen expanded section */}
        {expandedSection && (
          <div className="fixed inset-0 bg-white z-40 overflow-hidden">
            <Card 
              className={`h-full overflow-hidden transition-all duration-300 ease-in-out transform ${
                isTransitioning ? 'opacity-90 scale-[0.99]' : 'opacity-100 scale-100'
              }`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <CardHeader 
                className="pb-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={navigateToPreviousSection}
                      className="p-1 h-8 w-8 hover:bg-gray-200 transition-colors"
                      title="Previous section (Arrow Left/Up)"
                      disabled={isTransitioning}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {sections.find(s => s.id === expandedSection)?.icon}
                    <CardTitle className="text-lg cursor-pointer transition-colors" onClick={() => setExpandedSection(null)}>
                      {sections.find(s => s.id === expandedSection)?.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <span>{getCurrentSectionIndex() + 1} of {sections.length}</span>
                      <span className="text-xs opacity-70">• Scroll to navigate</span>
                    </span>
                    <Badge variant={sections.find(s => s.id === expandedSection)?.badgeVariant as any}>
                      {sections.find(s => s.id === expandedSection)?.badge}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={navigateToNextSection}
                      className="p-1 h-8 w-8 hover:bg-gray-200 transition-colors"
                      title="Next section (Arrow Right/Down)"
                      disabled={isTransitioning}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedSection(null)}
                      className="p-1 h-8 w-8 hover:bg-gray-200 transition-colors"
                      title="Close section (Escape)"
                    >
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 h-[calc(100vh-80px)] overflow-y-auto transition-all duration-300 ease-in-out" data-scroll-container>
                {sections.find(s => s.id === expandedSection)?.content}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Mobile: Same design as desktop - grid for collapsed, full-width for expanded */}
      <div className="block lg:hidden">
        {/* Show grid only when no section is expanded */}
        {!expandedSection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.map((section) => (
              <Card key={section.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200">
                <CardHeader 
                  className="pb-3 hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <CardTitle className="text-base sm:text-lg">{section.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={section.badgeVariant as any}>
                        {section.badge}
                      </Badge>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
        
        {/* Show full screen expanded section */}
        {expandedSection && (
          <div className="fixed inset-0 bg-white z-40 overflow-hidden">
            <Card 
              className={`h-full overflow-hidden transition-all duration-300 ease-in-out transform ${
                isTransitioning ? 'opacity-90 scale-[0.99]' : 'opacity-100 scale-100'
              }`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <CardHeader 
                className="pb-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={navigateToPreviousSection}
                      className="p-1 h-8 w-8 hover:bg-gray-200 transition-colors"
                      title="Previous section"
                      disabled={isTransitioning}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {sections.find(s => s.id === expandedSection)?.icon}
                    <CardTitle className="text-base sm:text-lg cursor-pointer transition-colors" onClick={() => setExpandedSection(null)}>
                      {sections.find(s => s.id === expandedSection)?.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <span>{getCurrentSectionIndex() + 1}/{sections.length}</span>
                      <span className="text-xs opacity-70 hidden sm:inline">• Scroll</span>
                    </span>
                    <Badge variant={sections.find(s => s.id === expandedSection)?.badgeVariant as any}>
                      {sections.find(s => s.id === expandedSection)?.badge}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={navigateToNextSection}
                      className="p-1 h-8 w-8 hover:bg-gray-200 transition-colors"
                      title="Next section"
                      disabled={isTransitioning}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedSection(null)}
                      className="p-1 h-8 w-8 hover:bg-gray-200 transition-colors"
                      title="Close section"
                    >
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 h-[calc(100vh-80px)] overflow-y-auto transition-all duration-300 ease-in-out" data-scroll-container>
                {sections.find(s => s.id === expandedSection)?.content}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Persistent Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
        <div className="flex justify-center">
          <div className="flex space-x-2 bg-gray-50 p-2 rounded-lg">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === section.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {section.icon}
                <span className="hidden sm:inline">{section.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}