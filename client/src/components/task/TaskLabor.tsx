import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, User } from 'lucide-react';
import { Labor, Contact } from '@shared/schema';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TaskLaborProps {
  taskId: number;
  compact?: boolean;
}

export function TaskLabor({ taskId, compact = false }: TaskLaborProps) {
  // Fetch task-related labor
  const { data: taskLabor = [], isLoading: isLoadingLabor } = useQuery<Labor[]>({
    queryKey: [`/api/tasks/${taskId}/labor`],
    enabled: taskId > 0,
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

  // Get unique contacts involved with this task's labor
  const uniqueContactIds = React.useMemo(() => {
    const uniqueIds = new Set<number>();
    taskLabor.forEach(labor => {
      if (labor.contactId) {
        uniqueIds.add(labor.contactId);
      }
    });
    return Array.from(uniqueIds);
  }, [taskLabor]);

  // If still loading or no data, show minimal content
  if (isLoadingLabor || isLoadingContacts) {
    return (
      <div className="flex items-center text-sm text-muted-foreground mt-1">
        <Users className="h-4 w-4 mr-1 text-orange-500" />
        <span>Loading...</span>
      </div>
    );
  }

  // If no labor entries, show that info
  if (taskLabor.length === 0) {
    return (
      <div className="flex items-center text-sm text-muted-foreground mt-1">
        <Users className="h-4 w-4 mr-1 text-orange-500" />
        <span>No labor assigned</span>
      </div>
    );
  }

  // In compact mode, just show the count with icons
  if (compact) {
    return (
      <div className="flex items-center text-sm text-muted-foreground mt-1">
        <Users className="h-4 w-4 mr-1 text-orange-500" />
        <span>{taskLabor.length} labor entries</span>
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
    <div className="mt-2">
      <div className="flex items-center text-sm font-medium mb-1">
        <Users className="h-4 w-4 mr-1 text-orange-500" />
        <span>Labor ({taskLabor.length} entries)</span>
      </div>
      <div className="flex flex-col space-y-1 pl-5">
        {uniqueContactIds.map(contactId => {
          const contact = contactMap.get(contactId);
          const contactLabor = taskLabor.filter(l => l.contactId === contactId);
          
          return (
            <div key={contactId} className="flex items-center text-xs text-slate-600">
              <User className="h-3 w-3 mr-1 text-slate-400" />
              <span className="font-medium">{contact?.name || 'Unknown'}</span>
              <span className="ml-1">({contactLabor.length} entries)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}