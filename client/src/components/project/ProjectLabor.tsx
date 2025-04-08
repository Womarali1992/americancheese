import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, HardHat } from 'lucide-react';
import { Labor, Contact } from '@shared/schema';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ProjectLaborProps {
  projectId: number;
  compact?: boolean;
  className?: string;
}

export function ProjectLabor({ projectId, compact = true, className = "" }: ProjectLaborProps) {
  // Fetch project-related labor
  const { data: projectLabor = [], isLoading: isLoadingLabor } = useQuery<Labor[]>({
    queryKey: [`/api/projects/${projectId}/labor`],
    enabled: projectId > 0,
    staleTime: 60000, // 1 minute
  });

  // Fetch all contacts (for display names)
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Create a map of contact id to contact for quicker lookups
  const contactMap = React.useMemo(() => {
    const map = new Map<number, Contact>();
    contacts.forEach(contact => {
      map.set(contact.id, contact);
    });
    return map;
  }, [contacts]);

  // Get unique contacts involved with this project's labor
  const uniqueContactIds = React.useMemo(() => {
    const uniqueIds = new Set<number>();
    projectLabor.forEach(labor => {
      if (labor.contactId) {
        uniqueIds.add(labor.contactId);
      }
    });
    return Array.from(uniqueIds);
  }, [projectLabor]);

  // If still loading or no data, show minimal content
  if (isLoadingLabor || isLoadingContacts) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <HardHat className="h-4 w-4 mr-1" />
        <span>Loading labor info...</span>
      </div>
    );
  }

  // If no labor entries, show that info
  if (projectLabor.length === 0) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <HardHat className="h-4 w-4 mr-1" />
        <span>No labor entries</span>
      </div>
    );
  }

  // In compact mode, just show the count with icons
  if (compact) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <HardHat className="h-4 w-4 mr-1" />
        <span>{projectLabor.length} labor entries</span>
        {uniqueContactIds.length > 0 && (
          <div className="flex -space-x-2 ml-2">
            {uniqueContactIds.slice(0, 3).map(contactId => {
              const contact = contactMap.get(contactId);
              const initials = contact?.name 
                ? contact.name.split(' ').map(n => n[0]).join('').toUpperCase()
                : '??';
              
              return (
                <TooltipProvider key={contactId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-5 w-5 border border-white">
                        <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{contact?.name || 'Unknown Contact'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
            {uniqueContactIds.length > 3 && (
              <Avatar className="h-5 w-5 border border-white">
                <AvatarFallback className="text-[10px] bg-slate-100 text-slate-700">
                  +{uniqueContactIds.length - 3}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full mode with more detailed information
  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex items-center text-sm font-medium mb-1">
        <Users className="h-4 w-4 mr-1" />
        <span>Labor ({projectLabor.length} entries)</span>
      </div>
      <div className="flex flex-col space-y-1 pl-5">
        {uniqueContactIds.map(contactId => {
          const contact = contactMap.get(contactId);
          const contactLabor = projectLabor.filter(l => l.contactId === contactId);
          
          return (
            <div key={contactId} className="flex items-center text-xs text-slate-600">
              <Users className="h-3 w-3 mr-1 text-slate-400" />
              <span className="font-medium">{contact?.name || 'Unknown'}</span>
              <span className="ml-1">({contactLabor.length} entries)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}