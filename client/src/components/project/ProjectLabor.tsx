import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, HardHat, User } from 'lucide-react';
import { Labor, Contact } from '@shared/schema';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils';

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
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium flex items-center">
          <Users className="h-4 w-4 mr-1" />
          Loading Labor...
        </span>
      </div>
    );
  }

  // If no labor entries, show that info
  if (projectLabor.length === 0) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium flex items-center">
          <Users className="h-4 w-4 mr-1" />
          No Labor Assigned
        </span>
      </div>
    );
  }

  // In compact mode, just show the count with icons
  if (compact) {
    // Calculate total labor cost
    const totalLaborCost = projectLabor.reduce((sum, labor) => {
      const cost = labor.laborCost ? Number(labor.laborCost) : 0;
      return sum + cost;
    }, 0);
    
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium flex items-center">
          <Users className="h-4 w-4 mr-1" />
          Labor ({projectLabor.length})
          {totalLaborCost > 0 && (
            <span className="ml-2 text-xs bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded-full">
              ${totalLaborCost.toFixed(2)}
            </span>
          )}
        </span>
        
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
  // Calculate total labor cost across all contacts
  const totalLaborCost = projectLabor.reduce((sum, labor) => {
    const cost = labor.laborCost ? Number(labor.laborCost) : 0;
    return sum + cost;
  }, 0);
  
  // Calculate total hours across all labor entries
  const totalHours = projectLabor.reduce((sum, labor) => {
    return sum + (labor.totalHours || 0);
  }, 0);

  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex items-center text-sm font-medium mb-2">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium flex items-center">
          <Users className="h-4 w-4 mr-1" />
          Labor Entries ({projectLabor.length}, {totalHours} hrs total)
          {totalLaborCost > 0 && (
            <span className="ml-2 text-xs bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded-full">
              ${totalLaborCost.toFixed(2)}
            </span>
          )}
        </span>
      </div>
      
      <div className="flex flex-col space-y-2 pl-2">
        {uniqueContactIds.map(contactId => {
          const contact = contactMap.get(contactId);
          const contactLabor = projectLabor.filter(l => l.contactId === contactId);
          const contactHours = contactLabor.reduce((total, labor) => total + (labor.totalHours || 0), 0);
          const contactCost = contactLabor.reduce((sum, labor) => {
            const cost = labor.laborCost ? Number(labor.laborCost) : 0;
            return sum + cost;
          }, 0);
          
          return (
            <div key={contactId} className="p-2 border rounded-md bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">{contact?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center text-xs space-x-2">
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                    {contactHours} hrs
                  </span>
                  {contactCost > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                      ${contactCost.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}