import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, User } from 'lucide-react';
import { Labor, Contact } from '@shared/schema';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ItemDetailPopup } from '@/components/task/ItemDetailPopup';

interface TaskLaborProps {
  taskId: number;
  compact?: boolean;
  className?: string;
}

export function TaskLabor({ taskId, compact = false, className = "" }: TaskLaborProps) {
  // State for showing detail popup
  const [selectedLabor, setSelectedLabor] = useState<Labor | null>(null);

  // Log for debugging
  console.log("Task labor entries general data:", { laborEntriesCount: 0, taskId });

  // Fetch task-related labor
  const { data: taskLabor = [], isLoading: isLoadingLabor } = useQuery<Labor[]>({
    queryKey: [`/api/tasks/${taskId}/labor`],
    enabled: taskId > 0,
    staleTime: 60000, // 1 minute
  });

  // Log for debugging
  console.log(`Direct task/${taskId}/labor query found ${taskLabor.length} labor entries`);

  // Fetch all labor (as a backup and for total hours)
  const { data: allLabor = [], isLoading: isLoadingAllLabor } = useQuery<Labor[]>({
    queryKey: ['/api/labor'],
    enabled: taskId > 0,
    staleTime: 60000, // 1 minute
  });

  // Also try filtering allLabor for this task (in case the direct query doesn't work)
  const filteredLaborByTask = allLabor.filter(labor => labor.taskId === taskId);
  console.log(`Filtered general labor list found ${filteredLaborByTask.length} labor entries for task ${taskId}`);

  // Combine both sources to ensure we have all labor entries
  const combinedLabor = React.useMemo(() => {
    if (taskLabor.length > 0) return taskLabor;
    return filteredLaborByTask;
  }, [taskLabor, filteredLaborByTask]);

  // Log the final list for debugging
  console.log("Task labor entries:", { allLabor: allLabor.length, filteredLabor: filteredLaborByTask.length, taskId });

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

  // Calculate total hours across all labor entries
  const totalHours = React.useMemo(() => {
    return combinedLabor.reduce((total, labor) => {
      return total + (labor.hours || 0);
    }, 0);
  }, [combinedLabor]);

  // Get unique contacts involved with this task's labor
  const uniqueContactIds = React.useMemo(() => {
    const uniqueIds = new Set<number>();
    combinedLabor.forEach(labor => {
      if (labor.contactId) {
        uniqueIds.add(labor.contactId);
      }
    });
    return Array.from(uniqueIds);
  }, [combinedLabor]);

  // Handle clicking on a labor entry
  const handleLaborClick = (labor: Labor) => {
    setSelectedLabor(labor);
  };

  // If still loading or no data, show minimal content
  if (isLoadingLabor || isLoadingContacts || isLoadingAllLabor) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <Users className="h-4 w-4 mr-1 text-orange-500" />
        <span>Loading...</span>
      </div>
    );
  }

  // If no labor entries, show that info
  if (combinedLabor.length === 0) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <Users className="h-4 w-4 mr-1 text-orange-500" />
        <span>No labor assigned</span>
      </div>
    );
  }

  // In compact mode, just show the count with icons
  if (compact) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground mt-1 ${className}`}>
        <Users className="h-4 w-4 mr-1 text-orange-500" />
        <span>
          {combinedLabor.length} labor entries 
          {totalHours > 0 && ` (${totalHours} hrs)`}
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
                      <Avatar 
                        className="h-5 w-5 border border-white cursor-pointer"
                        onClick={() => {
                          const laborForContact = combinedLabor.find(l => l.contactId === contactId);
                          if (laborForContact) handleLaborClick(laborForContact);
                        }}
                      >
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
        <Users className="h-4 w-4 mr-1 text-orange-500" />
        <span>Labor ({combinedLabor.length} entries, {totalHours} hrs total)</span>
      </div>
      <div className="flex flex-col space-y-2 pl-5">
        {uniqueContactIds.map(contactId => {
          const contact = contactMap.get(contactId);
          const contactLabor = combinedLabor.filter(l => l.contactId === contactId);
          const contactHours = contactLabor.reduce((total, labor) => total + (labor.hours || 0), 0);
          
          return (
            <div 
              key={contactId} 
              className="flex items-center text-xs text-slate-600 cursor-pointer hover:bg-slate-50 p-1 rounded"
              onClick={() => handleLaborClick(contactLabor[0])}
            >
              <User className="h-3 w-3 mr-1 text-slate-400" />
              <span className="font-medium">{contact?.name || 'Unknown'}</span>
              <span className="ml-1">
                ({contactLabor.length} entries, {contactHours} hrs)
              </span>
            </div>
          );
        })}
      </div>

      {/* Labor detail popup */}
      {selectedLabor && (
        <ItemDetailPopup
          item={selectedLabor}
          itemType="labor"
          onClose={() => setSelectedLabor(null)}
        />
      )}
    </div>
  );
}