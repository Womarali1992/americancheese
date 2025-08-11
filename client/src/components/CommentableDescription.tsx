import React, { useState, useEffect, useRef } from 'react';
import { X, Link, Unlink, MousePointer, Plus, Minus, ArrowDown, AlertTriangle, Flag, MessageCircle, Copy, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { SectionState, InsertSectionState } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface CommentableDescriptionProps {
  description: string;
  title?: string;
  className?: string;
  onDescriptionChange?: (newDescription: string) => void | Promise<void>;
  entityType?: string; // 'task', 'subtask', etc.
  entityId?: number;    // The actual ID of the entity (subtaskId for subtasks)
  fieldName?: string;   // 'description', 'notes', etc.
  readOnly?: boolean;   // If true, disable commenting functionality
  onCommentClick?: (sectionIndex: number) => void; // Callback to trigger the existing comment dialog
  showExportButton?: boolean; // Show the export button
  // Context data for full export functionality
  contextData?: {
    project?: { id: number; name: string; description?: string; };
    task?: { 
      id: number; 
      title: string; 
      description?: string; 
      tier1Category?: string; 
      tier2Category?: string;
      tier1CategoryDescription?: string;
      tier2CategoryDescription?: string;
    };
    subtask?: { id: number; title: string; description?: string; };
  };
}

export function CommentableDescription({ 
  description, 
  title = "Document", 
  className = "",
  onDescriptionChange,
  entityType = "subtask",
  entityId = 1,
  fieldName = "description",
  readOnly = false,
  onCommentClick,
  showExportButton = false,
  contextData
}: CommentableDescriptionProps) {
  const [selectedSections, setSelectedSections] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [firstSelectedSection, setFirstSelectedSection] = useState<number | null>(null);
  const [cautionSections, setCautionSections] = useState<Set<number>>(new Set());
  const [flaggedSections, setFlaggedSections] = useState<Set<number>>(new Set());

  // Split description into sections using the specified regex
  const initialSections = description.split(
    /\n{2,}|(?=^#{1,2}\s)|(?=^\s*[-*]\s)|(?=^\s*\d+\.\s)/gm
  ).filter(Boolean);
  
  const [sections, setSections] = useState<string[]>(initialSections);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isUpdatingRef = useRef(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use provided entity information for database storage
  const [combinedSections, setCombinedSections] = useState<Set<number>>(new Set());
  const [sectionStateId, setSectionStateId] = useState<number | null>(null);

  // State for managing inline comments
  const [sectionComments, setSectionComments] = useState<{[key: number]: any[]}>({});

  // Fetch comments for sections
  const fetchSectionComments = async () => {
    try {
      const response = await fetch(`/api/subtasks/${entityId}/comments`);
      if (response.ok) {
        const comments = await response.json();
        
        // Group comments by section
        const commentsBySection: {[key: number]: any[]} = {};
        comments.forEach((comment: any) => {
          // Only show comments that have a valid sectionId
          // Comments without sectionId should not be displayed in the CommentableDescription
          if (comment.sectionId !== null && comment.sectionId !== undefined) {
            const sectionIndex = comment.sectionId;
            
            if (!commentsBySection[sectionIndex]) {
              commentsBySection[sectionIndex] = [];
            }
            commentsBySection[sectionIndex].push(comment);
          }
        });
        
        setSectionComments(commentsBySection);
      }
    } catch (error) {
      console.warn('Failed to fetch section comments:', error);
    }
  };

  // Load comments when component mounts and refresh from query cache
  useEffect(() => {
    if (entityId) {
      fetchSectionComments();
    }
  }, [entityId]);

  // Listen for query cache updates to refresh comments (optimized)
  useEffect(() => {
    const handleQueryUpdate = () => {
      if (entityId) {
        fetchSectionComments();
      }
    };

    // Set up a listener for query cache updates with longer interval
    const interval = setInterval(handleQueryUpdate, 10000); // Reduced frequency from 2s to 10s
    return () => clearInterval(interval);
  }, [entityId]);

  // Load section state from database
  const loadSectionState = async () => {
    try {
      const response = await fetch(`/api/section-states/${entityType}/${entityId}/${fieldName}`);
      if (response.ok) {
        const sectionState = await response.json();
        if (sectionState && sectionState.combinedSections) {
          const combinedIndices = sectionState.combinedSections.map((idx: string) => parseInt(idx));
          const validCombinedIndices = validateSectionIndices(new Set(combinedIndices));
          setCombinedSections(validCombinedIndices);
          setSectionStateId(sectionState.id);
          console.log('Loaded section state from database:', sectionState);
          console.log('Valid combined section indices after validation:', Array.from(validCombinedIndices));
          
          // Also restore caution and flagged sections if they exist
          if (sectionState.cautionSections) {
            const cautionIndices = sectionState.cautionSections.map((idx: string) => parseInt(idx));
            const validCautionIndices = validateSectionIndices(new Set(cautionIndices));
            setCautionSections(validCautionIndices);
          }
          if (sectionState.flaggedSections) {
            const flaggedIndices = sectionState.flaggedSections.map((idx: string) => parseInt(idx));
            const validFlaggedIndices = validateSectionIndices(new Set(flaggedIndices));
            setFlaggedSections(validFlaggedIndices);
          }
          
          // If we filtered out invalid indices, save the corrected state
          if (validCombinedIndices.size !== combinedIndices.length) {
            console.log('Some section indices were invalid, updating database with valid indices');
            saveSectionState(validCombinedIndices, new Set(), new Set());
          }
        } else {
          // No existing section state found, reset to empty
          setCombinedSections(new Set());
          setCautionSections(new Set());
          setFlaggedSections(new Set());
          setSectionStateId(null);
        }
      }
    } catch (error) {
      console.warn('Failed to load section state from database:', error);
    }
  };

  // Save section state to database
  const saveSectionState = async (newCombinedSections: Set<number>, cautionSections: Set<number> = new Set(), flaggedSections: Set<number> = new Set()) => {
    try {
      const sectionStateData = {
        entityType,
        entityId,
        fieldName,
        combinedSections: Array.from(newCombinedSections).map(String),
        cautionSections: Array.from(cautionSections).map(String),
        flaggedSections: Array.from(flaggedSections).map(String)
      };

      const response = await fetch('/api/section-states', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionStateData),
      });

      if (response.ok) {
        const result = await response.json();
        setSectionStateId(result.id);
        console.log('Saved section state to database:', result);
      }
    } catch (error) {
      console.warn('Failed to save section state to database:', error);
    }
  };

  // Load section state on component mount
  useEffect(() => {
    loadSectionState();
  }, [entityType, entityId, fieldName]);

  // Wrapper function to update combinedSections and save to database
  const updateCombinedSections = (newCombinedSections: Set<number>) => {
    setCombinedSections(newCombinedSections);
    saveSectionState(newCombinedSections, cautionSections, flaggedSections);
  };

  // Helper function to validate and filter section indices based on current sections array
  const validateSectionIndices = (indices: Set<number>) => {
    const validIndices = new Set<number>();
    console.log('Validating section indices:', Array.from(indices), 'against sections length:', sections.length);
    indices.forEach(index => {
      if (index >= 0 && index < sections.length) {
        validIndices.add(index);
      } else {
        console.log('Invalid section index:', index, 'sections.length:', sections.length);
      }
    });
    return validIndices;
  };

  // Comment functionality removed - handled by SubtaskComments component

  // Helper function to convert sections back to description
  const sectionsToDescription = (sectionsArray: string[]) => {
    return sectionsArray.join('\n\n');
  };

  // Reset sections when description changes, but not if we're in the middle of updating
  useEffect(() => {
    // Don't reset if we're currently updating (to prevent interference with our own changes)
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false;
      return;
    }
    
    const newSections = description.split(
      /\n{2,}|(?=^#{1,2}\s)|(?=^\s*[-*]\s)|(?=^\s*\d+\.\s)/gm
    ).filter(Boolean);
    
    setSections(newSections);
    setSelectedSections(new Set());
    setHasUnsavedChanges(false);
    
    // Load section state from database after setting new sections
    // This needs to happen after setSections but we don't reset the states here
    // as they will be set by loadSectionState()
    // Add a small delay to ensure sections state is updated
    setTimeout(() => {
      loadSectionState();
    }, 0);
  }, [description, title]);

  const handleSectionClick = (sectionId: number) => {
    console.log('Section clicked:', sectionId, 'Selection mode:', isSelectionMode);
    if (isSelectionMode) {
      console.log('In selection mode - toggling selection');
      toggleSectionSelection(sectionId);
    } else {
      // In read-only mode, sections are not interactive
      if (readOnly) {
        return;
      }
      // For non-readonly mode, section clicks now trigger selection mode
      // Comments are handled by the dedicated comment button
      console.log('Switching to selection mode and selecting section');
      setIsSelectionMode(true);
      toggleSectionSelection(sectionId);
    }
  };

  const toggleSectionSelection = (sectionId: number) => {
    console.log('Toggling selection for section:', sectionId);
    setSelectedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
        console.log('Deselected section:', sectionId, 'New size:', newSet.size);
        // If deselecting the first section, clear it
        if (sectionId === firstSelectedSection) {
          setFirstSelectedSection(null);
        }
      } else {
        newSet.add(sectionId);
        console.log('Selected section:', sectionId, 'New size:', newSet.size);
        // If this is the first selection, mark it as the starting point
        if (firstSelectedSection === null) {
          setFirstSelectedSection(sectionId);
        }
      }
      console.log('Current selected sections:', Array.from(newSet));
      return newSet;
    });
  };

  const combineToSection = async (endSectionId: number) => {
    if (firstSelectedSection === null || firstSelectedSection >= endSectionId) return;
    
    console.log(`Combining sections from ${firstSelectedSection} to ${endSectionId}`);
    
    // Create array of section indices to combine (inclusive range)
    const startIdx = Math.min(firstSelectedSection, endSectionId);
    const endIdx = Math.max(firstSelectedSection, endSectionId);
    
    // Combine all sections in the range
    const combinedText = sections.slice(startIdx, endIdx + 1).join('\n\n');
    
    // Create new sections array
    const newSections = [...sections];
    newSections.splice(startIdx, endIdx - startIdx + 1, combinedText);
    
    setSections(newSections);
    setSelectedSections(new Set());
    setFirstSelectedSection(null);
    
    // Save the changes back to the parent component
    if (onDescriptionChange) {
      isUpdatingRef.current = true;
      const newDescription = sectionsToDescription(newSections);
      
      try {
        setIsSaving(true);
        await onDescriptionChange(newDescription);
        setHasUnsavedChanges(false);
        
        // After combining sections, mark the first section as combined
        const newCombinedSections = new Set([startIdx]);
        
        setCombinedSections(newCombinedSections);
        setCautionSections(new Set());
        setFlaggedSections(new Set());
        
        // Save the updated state to database
        try {
          await saveSectionState(newCombinedSections, new Set(), new Set());
          console.log('Combined sections saved to database');
        } catch (error) {
          console.log('Failed to save combined sections state to database:', error);
        }
        
        console.log(`Combined ${endIdx - startIdx + 1} sections into section ${startIdx}`);
      } catch (error) {
        console.error('Failed to save combined description:', error);
        setHasUnsavedChanges(true);
      } finally {
        setIsSaving(false);
      }
    } else {
      setHasUnsavedChanges(true);
      // Mark as combined and save to database even if we can't save the description
      const newCombinedSections = new Set([0]);
      setCombinedSections(newCombinedSections);
      saveSectionState(newCombinedSections, new Set(), new Set());
      console.log(`Combined ${endIdx - startIdx + 1} sections into section ${startIdx}`);
    }
  };

  const combineSections = async () => {
    if (selectedSections.size < 2) return;

    const sortedIds = Array.from(selectedSections).sort((a, b) => a - b);
    const combinedText = sortedIds.map(id => sections[id]).join('\n\n');
    console.log('Combining sections:', sortedIds, 'Combined text:', combinedText.substring(0, 100) + '...');
    
    // Create new sections array with combined sections
    const newSections = [...sections];
    newSections[sortedIds[0]] = combinedText;
    
    // Remove the other sections (in reverse order to maintain indices)
    for (let i = sortedIds.length - 1; i > 0; i--) {
      newSections.splice(sortedIds[i], 1);
    }
    
    setSections(newSections);
    setSelectedSections(new Set());
    setIsSelectionMode(false);
    
    // Save the changes back to the parent component
    if (onDescriptionChange) {
      isUpdatingRef.current = true;
      const newDescription = sectionsToDescription(newSections);
      console.log('Calling onDescriptionChange from combineSections with:', newDescription.substring(0, 100) + '...');
      
      try {
        setIsSaving(true);
        console.log('Starting to save combined description...');
        
        // Call the description change callback and wait for it to complete
        await onDescriptionChange(newDescription);
        console.log('Description change callback completed successfully');
        
        // Add a small delay to make the saving indicator visible
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setHasUnsavedChanges(false);
        
        // After combining sections, mark the first section as combined and clear old states
        // Since the description structure completely changes, we need to save this state
        const newCombinedSections = new Set([sortedIds[0]]);
        
        setCombinedSections(newCombinedSections);
        setCautionSections(new Set());
        setFlaggedSections(new Set());
        
        // Save the updated state to database
        try {
          await saveSectionState(newCombinedSections, new Set(), new Set());
          console.log('Saved combined sections state to database');
        } catch (error) {
          console.log('Failed to save combined sections state to database:', error);
        }
        console.log('Section combination completed and saved successfully');
        
        // Show success toast
        toast({
          title: "Sections Combined",
          description: `Successfully combined ${sortedIds.length} sections and saved to database.`,
        });
      } catch (error) {
        console.error('Failed to save combined description:', error);
        setHasUnsavedChanges(true);
        // Keep the combined sections state if save failed
        updateCombinedSections(new Set([0]));
        
        // Show error toast
        toast({
          title: "Save Failed",
          description: "Failed to save the combined sections. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      console.log('No onDescriptionChange callback provided, marking as unsaved');
      setHasUnsavedChanges(true);
      // Mark as combined and save to database even if we can't save the description
      const newCombinedSections = new Set([...Array.from(combinedSections), sortedIds[0]]);
      updateCombinedSections(newCombinedSections);
    }
  };

  const separateSection = (sectionId: number) => {
    const sectionText = sections[sectionId];
    const separatedSections = sectionText.split(
      /\n{2,}|(?=^#{1,2}\s)|(?=^\s*[-*]\s)|(?=^\s*\d+\.\s)/gm
    ).filter(Boolean);
    
    if (separatedSections.length <= 1) return;

    const newSections = [...sections];
    newSections.splice(sectionId, 1, ...separatedSections);
    
    setSections(newSections);
    const newCombinedSections = new Set(combinedSections);
    newCombinedSections.delete(sectionId);
    updateCombinedSections(newCombinedSections);
    
    // Save the changes back to the parent component
    if (onDescriptionChange) {
      isUpdatingRef.current = true;
      const newDescription = sectionsToDescription(newSections);
      onDescriptionChange(newDescription);
      setHasUnsavedChanges(false);
    } else {
      setHasUnsavedChanges(true);
    }
  };

  const clearSelection = () => {
    setSelectedSections(new Set());
    setIsSelectionMode(false);
  };

  const toggleCautionSection = (sectionId: number) => {
    let newCautionSections: Set<number>;
    let newFlaggedSections = new Set(flaggedSections);
    
    setCautionSections(prev => {
      newCautionSections = new Set(prev);
      if (newCautionSections.has(sectionId)) {
        newCautionSections.delete(sectionId);
      } else {
        // Remove from flagged if it was flagged (can't be both)
        newFlaggedSections.delete(sectionId);
        setFlaggedSections(newFlaggedSections);
        newCautionSections.add(sectionId);
      }
      
      // Save to database
      saveSectionState(combinedSections, newCautionSections, newFlaggedSections);
      
      return newCautionSections;
    });
  };

  const toggleFlaggedSection = (sectionId: number) => {
    let newFlaggedSections: Set<number>;
    let newCautionSections = new Set(cautionSections);
    
    setFlaggedSections(prev => {
      newFlaggedSections = new Set(prev);
      if (newFlaggedSections.has(sectionId)) {
        newFlaggedSections.delete(sectionId);
      } else {
        // Remove from caution if it was cautioned (can't be both)
        newCautionSections.delete(sectionId);
        setCautionSections(newCautionSections);
        newFlaggedSections.add(sectionId);
      }
      
      // Save to database
      saveSectionState(combinedSections, newCautionSections, newFlaggedSections);
      
      return newFlaggedSections;
    });
  };

  // Export function that processes the content according to the rules while preserving formatting
  const exportSubtask = async () => {
    try {
      // Start with the original description to preserve all formatting
      let exportContent = description;
      
      // If there are flagged sections or comments, we need to process section by section
      if (flaggedSections.size > 0 || Object.keys(sectionComments).length > 0) {
        let processedSections = [];
        
        // Process each section
        for (let i = 0; i < sections.length; i++) {
          // Skip red-flagged sections (automatically remove them)
          if (flaggedSections.has(i)) {
            continue;
          }
          
          let sectionText = sections[i];
          
          // If section has comments, replace text with comments
          // BUT if section is yellow-flagged (caution), keep original text and ignore comments
          if (sectionComments[i] && sectionComments[i].length > 0 && !cautionSections.has(i)) {
            // Combine all comments for this section, preserving any indentation from the original section
            const commentTexts = sectionComments[i].map(comment => comment.content).join('\n');
            sectionText = commentTexts;
          }
          
          processedSections.push(sectionText);
        }
        
        // Reconstruct the content with original section separators
        exportContent = processedSections.join('\n\n');
      }
      
      // Copy to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(exportContent);
        toast({
          title: "Subtask Exported",
          description: "Updated subtask content copied to clipboard (red-flagged sections removed, comments replaced text except for yellow-flagged sections).",
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = exportContent;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast({
            title: "Subtask Exported",
            description: "Updated subtask content copied to clipboard (red-flagged sections removed, comments replaced text except for yellow-flagged sections).",
          });
        } catch (err) {
          toast({
            title: "Export Failed",
            description: "Please manually copy the processed content: " + exportContent,
            variant: "destructive",
          });
        }
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting the subtask.",
        variant: "destructive",
      });
    }
  };

  // Export function with full context including project, task, and subtask information
  const exportFullContext = async () => {
    try {
      // Start with the original description to preserve all formatting
      let exportContent = description;
      
      // If there are flagged sections or comments, we need to process section by section
      if (flaggedSections.size > 0 || Object.keys(sectionComments).length > 0) {
        let processedSections = [];
        
        // Process each section
        for (let i = 0; i < sections.length; i++) {
          // Skip red-flagged sections (automatically remove them)
          if (flaggedSections.has(i)) {
            continue;
          }
          
          let sectionText = sections[i];
          
          // If section has comments, replace text with comments
          // BUT if section is yellow-flagged (caution), keep original text and ignore comments
          if (sectionComments[i] && sectionComments[i].length > 0 && !cautionSections.has(i)) {
            // Combine all comments for this section, preserving any indentation from the original section
            const commentTexts = sectionComments[i].map(comment => comment.content).join('\n');
            sectionText = commentTexts;
          }
          
          processedSections.push(sectionText);
        }
        
        // Reconstruct the content with original section separators
        exportContent = processedSections.join('\n\n');
      }

      // Build the full context export
      let fullContextExport = '';
      
      // Add project information
      if (contextData?.project) {
        fullContextExport += `PROJECT: ${contextData.project.name}\n`;
        if (contextData.project.description) {
          fullContextExport += `Project Description: ${contextData.project.description}\n`;
        }
        fullContextExport += '\n';
      }
      
      // Add task information
      if (contextData?.task) {
        if (contextData.task.tier1Category) {
          fullContextExport += `Component Category: ${contextData.task.tier1Category}\n`;
          if (contextData.task.tier1CategoryDescription) {
            fullContextExport += `Component Category Description: ${contextData.task.tier1CategoryDescription}\n`;
          }
        }
        fullContextExport += '\n';
        if (contextData.task.tier2Category) {
          fullContextExport += `Feature Sub Category: ${contextData.task.tier2Category}\n`;
          if (contextData.task.tier2CategoryDescription) {
            fullContextExport += `Feature Sub Category Description: ${contextData.task.tier2CategoryDescription}\n`;
          }
        }
        fullContextExport += '\n';
        fullContextExport += `TASK: ${contextData.task.title}\n`;
        if (contextData.task.description) {
          fullContextExport += `Task Description: ${contextData.task.description}\n`;
        }
        fullContextExport += '\n';
      }
      
      // Add subtask information
      if (contextData?.subtask) {
        fullContextExport += `SUBTASK: ${contextData.subtask.title}\n`;
        fullContextExport += `Subtask Description:\n${exportContent}\n`;
        
        // Fetch and include overall subtask comments as conversations
        try {
          const response = await fetch(`/api/subtasks/${contextData.subtask.id}/comments`);
          if (response.ok) {
            const allComments = await response.json();
            // Filter for overall subtask comments (where sectionId is null)
            const overallComments = allComments.filter((comment: any) => comment.sectionId === null);
            
            if (overallComments.length > 0) {
              fullContextExport += `\n\nOVERALL SUBTASK CONVERSATIONS:\n`;
              overallComments.forEach((comment: any, index: number) => {
                fullContextExport += `\nConversation ${index + 1}:\n`;
                fullContextExport += `Author: ${comment.authorName}\n`;
                fullContextExport += `Date: ${new Date(comment.createdAt).toLocaleString()}\n`;
                fullContextExport += `Comment: ${comment.content}\n`;
              });
            }
          }
        } catch (error) {
          console.error('Failed to fetch subtask comments for export:', error);
        }
      } else {
        // If no subtask context, just add the processed content
        fullContextExport += exportContent;
      }
      
      // Copy to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullContextExport);
        toast({
          title: "Full Context Exported",
          description: "Complete context with project, task, and subtask information copied to clipboard.",
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = fullContextExport;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast({
            title: "Full Context Exported",
            description: "Complete context with project, task, and subtask information copied to clipboard.",
          });
        } catch (err) {
          toast({
            title: "Export Failed",
            description: "Please manually copy the processed content: " + fullContextExport,
            variant: "destructive",
          });
        }
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Full context export failed:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting the full context.",
        variant: "destructive",
      });
    }
  };

  // Comment-related functions are now handled directly in this component

  const renderSection = (section: string, index: number) => {
    const isCodeBlock = section.trim().startsWith('```') && section.trim().endsWith('```');
    const isSelected = selectedSections.has(index);
    const isCombined = combinedSections.has(index);
    const isCaution = cautionSections.has(index);
    const isFlagged = flaggedSections.has(index);
    const hasComments = sectionComments[index] && sectionComments[index].length > 0;
    
    // Determine border and background color priority: flagged > caution > selected > comments > default
    let borderColor = 'border-gray-200';
    let backgroundColor = '';
    
    if (isFlagged) {
      borderColor = 'border-red-400';
      backgroundColor = 'bg-red-50';
    } else if (isCaution) {
      borderColor = 'border-yellow-400';
      backgroundColor = 'bg-yellow-50';
    } else if (isSelected) {
      borderColor = 'border-purple-400';
      backgroundColor = 'bg-purple-50 shadow-md';
    } else if (hasComments) {
      borderColor = 'border-blue-400';
      backgroundColor = 'bg-blue-50';
    }
    
    return (
      <div
        key={index}
        data-section-id={index}
        draggable={true}
        className={`clickable-section relative group border-2 rounded-lg p-4 mb-4 transition-all duration-200 ${borderColor} ${backgroundColor} ${
          isSelectionMode 
            ? 'cursor-crosshair hover:border-purple-300 hover:bg-purple-100' 
            : 'cursor-grab active:cursor-grabbing hover:bg-gray-50 hover:border-gray-300'
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSectionClick(index);
        }}
        onDragStart={(e) => {
          e.stopPropagation();
          
          // Check if user is holding Ctrl/Cmd key for full subtask export
          const useFullSubtask = e.ctrlKey || e.metaKey;
          
          let exportContent;
          let dragDescription;
          
          if (useFullSubtask) {
            // Export the entire subtask with processing
            exportContent = description;
            
            // Apply the same processing logic as the export functions
            if (flaggedSections.size > 0 || Object.keys(sectionComments).length > 0) {
              let processedSections = [];
              
              for (let i = 0; i < sections.length; i++) {
                // Skip red-flagged sections
                if (flaggedSections.has(i)) {
                  continue;
                }
                
                let sectionText = sections[i];
                
                // If section has comments, replace text with comments (except for yellow-flagged)
                if (sectionComments[i] && sectionComments[i].length > 0 && !cautionSections.has(i)) {
                  const commentTexts = sectionComments[i].map(comment => comment.content).join('\n');
                  sectionText = commentTexts;
                }
                
                processedSections.push(sectionText);
              }
              
              exportContent = processedSections.join('\n\n');
            }
            
            dragDescription = `Full Subtask: ${title}`;
          } else {
            // Single section export
            exportContent = section;
            
            // If section has comments and is not cautioned, use comments as content
            if (sectionComments[index] && sectionComments[index].length > 0 && !cautionSections.has(index)) {
              const commentTexts = sectionComments[index].map(comment => comment.content).join('\n');
              exportContent = commentTexts;
            }
            
            // Skip red-flagged sections
            if (flaggedSections.has(index)) {
              e.preventDefault();
              return;
            }
            
            dragDescription = `Section ${index + 1}`;
          }
          
          // Clear any existing data and set multiple formats for broader compatibility
          e.dataTransfer.clearData();
          
          // Set the data for external applications in multiple formats
          try {
            e.dataTransfer.setData('text/plain', exportContent);
            e.dataTransfer.setData('text/html', `<div>${exportContent.replace(/\n/g, '<br>')}</div>`);
            e.dataTransfer.setData('text', exportContent); // Legacy format
            e.dataTransfer.setData('Text', exportContent); // Alternative format
            
            // For rich text applications
            const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 ${exportContent.replace(/\n/g, '\\par ')}}`;
            e.dataTransfer.setData('text/rtf', rtfContent);
            
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.dropEffect = 'copy';
            
            console.log(`Dragging ${useFullSubtask ? 'full subtask' : 'section ' + (index + 1)} content to external application:`, exportContent.substring(0, 100));
            console.log('Available data types:', e.dataTransfer.types);
          } catch (error) {
            console.error('Error setting drag data:', error);
          }
          
          // Create custom drag image for better visual feedback
          const dragImage = document.createElement('div');
          dragImage.innerHTML = `${dragDescription} - ${exportContent.substring(0, 50)}${exportContent.length > 50 ? '...' : ''}`;
          dragImage.style.cssText = 'position: absolute; top: -1000px; left: -1000px; background: white; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 300px; font-size: 12px; z-index: 9999;';
          document.body.appendChild(dragImage);
          e.dataTransfer.setDragImage(dragImage, 10, 10);
          setTimeout(() => {
            if (document.body.contains(dragImage)) {
              document.body.removeChild(dragImage);
            }
          }, 100);
        }}
        onDragEnd={(e) => {
          console.log('Drag operation completed for section', index + 1);
          
          // Fallback: If drag didn't work, copy to clipboard
          if (e.dataTransfer.dropEffect === 'none') {
            let sectionContent = section;
            
            // Apply same content logic as drag
            if (sectionComments[index] && sectionComments[index].length > 0 && !cautionSections.has(index)) {
              const commentTexts = sectionComments[index].map(comment => comment.content).join('\n');
              sectionContent = commentTexts;
            }
            
            if (!flaggedSections.has(index)) {
              navigator.clipboard.writeText(sectionContent).then(() => {
                toast({
                  title: "Content Copied",
                  description: "Section content copied to clipboard as fallback since drag to external app didn't work.",
                });
              }).catch(() => {
                console.log('Clipboard fallback also failed');
              });
            }
          }
        }}
      >
        {/* Drag handle indicator */}
        <div className="absolute top-2 left-2 opacity-30 group-hover:opacity-60 transition-opacity">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        {/* Section content */}
        <div className={`${isCodeBlock ? 'font-mono text-sm' : ''} pl-6`}>
          {isCodeBlock ? (
            <pre className="whitespace-pre-wrap overflow-x-auto">
              <code>{section}</code>
            </pre>
          ) : (
            <div className="whitespace-pre-wrap">{section}</div>
          )}
        </div>

        {/* Inline comments display */}
        {sectionComments[index] && sectionComments[index].length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-2">
              {sectionComments[index].map((comment: any) => (
                <div key={comment.id} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="text-gray-600 whitespace-pre-wrap bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
                      {comment.content}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                      <span className="font-medium text-gray-700">{comment.authorName}</span>
                      <span>•</span>
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section controls */}
        <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Copy section button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if ((e as any).stopImmediatePropagation) {
                (e as any).stopImmediatePropagation();
              }
              
              // Get the section content, including comments if present
              let contentToCopy = section;
              if (sectionComments[index] && sectionComments[index].length > 0) {
                contentToCopy += '\n\n--- Comments ---\n';
                sectionComments[index].forEach((comment: any) => {
                  contentToCopy += `${comment.authorName}: ${comment.content}\n`;
                });
              }
              
              // Copy to clipboard
              navigator.clipboard.writeText(contentToCopy).then(() => {
                toast({
                  title: "Section copied",
                  description: "The section content has been copied to your clipboard.",
                });
              }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = contentToCopy;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                  document.execCommand('copy');
                  toast({
                    title: "Section copied",
                    description: "The section content has been copied to your clipboard.",
                  });
                } catch (err) {
                  toast({
                    title: "Copy failed",
                    description: "Unable to copy to clipboard. Please try again.",
                    variant: "destructive",
                  });
                }
                document.body.removeChild(textArea);
              });
            }}
            className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
            title="Copy section content"
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          {/* Comment button */}
          {!readOnly && onCommentClick && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if ((e as any).stopImmediatePropagation) {
                  (e as any).stopImmediatePropagation();
                }
                onCommentClick(index);
              }}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
              title="Add comment"
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
          )}

          {/* Selection indicator */}
          {isSelected && (
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
          )}
          
          {/* Quick selection toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSectionSelection(index);
            }}
            className={`h-6 w-6 p-0 ${
              isSelected 
                ? 'text-purple-600 hover:text-purple-800' 
                : 'text-gray-500 hover:text-purple-600'
            }`}
            title={isSelected ? "Deselect this section" : "Select this section"}
          >
            {isSelected ? <Minus className="h-3 w-3" /> : <MousePointer className="h-3 w-3" />}
          </Button>
          
          {/* Caution toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCautionSection(index);
            }}
            className={`h-6 w-6 p-0 ${
              isCaution 
                ? 'text-yellow-600 hover:text-yellow-800' 
                : 'text-gray-500 hover:text-yellow-600'
            }`}
            title={isCaution ? "Remove caution mark" : "Mark section as caution"}
          >
            <AlertTriangle className="h-3 w-3" />
          </Button>
          
          {/* Flag toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFlaggedSection(index);
            }}
            className={`h-6 w-6 p-0 ${
              isFlagged 
                ? 'text-red-600 hover:text-red-800' 
                : 'text-gray-500 hover:text-red-600'
            }`}
            title={isFlagged ? "Remove flag mark" : "Flag section as important"}
          >
            <Flag className="h-3 w-3" />
          </Button>
          
          {/* Combine-to-here button (shows when another section is selected and this is after it) */}
          {firstSelectedSection !== null && firstSelectedSection < index && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                combineToSection(index);
              }}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
              title={`Combine sections ${firstSelectedSection + 1} through ${index + 1}`}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          )}
          
          {/* Combined section indicator */}
          {isCombined && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                separateSection(index);
              }}
              className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
              title="Separate this combined section"
            >
              <Unlink className="h-3 w-3" />
            </Button>
          )}
          
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`commentable-description ${className} relative group border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors`}
      draggable={true}
      onDragStart={(e) => {
        // Check if we're dragging from the export button or title area
        const target = e.target as HTMLElement;
        const isFromExportButton = target.closest('.flex.items-center.gap-1.bg-green-50');
        
        // For the entire subtask container, use processed export content
        let exportContent = description;
        
        // Apply the same processing logic as the export functions
        if (flaggedSections.size > 0 || Object.keys(sectionComments).length > 0) {
          let processedSections = [];
          
          for (let i = 0; i < sections.length; i++) {
            // Skip red-flagged sections
            if (flaggedSections.has(i)) {
              continue;
            }
            
            let sectionText = sections[i];
            
            // If section has comments, replace text with comments (except for yellow-flagged)
            if (sectionComments[i] && sectionComments[i].length > 0 && !cautionSections.has(i)) {
              const commentTexts = sectionComments[i].map(comment => comment.content).join('\n');
              sectionText = commentTexts;
            }
            
            processedSections.push(sectionText);
          }
          
          exportContent = processedSections.join('\n\n');
        }
        
        // If it's from export button area or context data exists, use full context
        if (isFromExportButton && contextData) {
          let fullContextExport = '';
          
          // Add project information
          if (contextData.project) {
            fullContextExport += `PROJECT: ${contextData.project.name}\n`;
            if (contextData.project.description) {
              fullContextExport += `Project Description: ${contextData.project.description}\n`;
            }
            fullContextExport += '\n';
          }
          
          // Add task information
          if (contextData.task) {
            if (contextData.task.tier1Category) {
              fullContextExport += `Component Category: ${contextData.task.tier1Category}\n`;
              if (contextData.task.tier1CategoryDescription) {
                fullContextExport += `Component Category Description: ${contextData.task.tier1CategoryDescription}\n`;
              }
            }
            fullContextExport += '\n';
            if (contextData.task.tier2Category) {
              fullContextExport += `Feature Sub Category: ${contextData.task.tier2Category}\n`;
              if (contextData.task.tier2CategoryDescription) {
                fullContextExport += `Feature Sub Category Description: ${contextData.task.tier2CategoryDescription}\n`;
              }
            }
            fullContextExport += '\n';
            fullContextExport += `TASK: ${contextData.task.title}\n`;
            if (contextData.task.description) {
              fullContextExport += `Task Description: ${contextData.task.description}\n`;
            }
            fullContextExport += '\n';
          }
          
          // Add subtask information
          if (contextData.subtask) {
            fullContextExport += `SUBTASK: ${contextData.subtask.title}\n`;
            fullContextExport += `Subtask Description:\n${exportContent}\n`;
          } else {
            fullContextExport += exportContent;
          }
          
          exportContent = fullContextExport;
        }
        
        // Clear any existing data and set multiple formats for broader compatibility
        e.dataTransfer.clearData();
        
        try {
          // Set the data for external applications in multiple formats
          e.dataTransfer.setData('text/plain', exportContent);
          e.dataTransfer.setData('text/html', `<div>${exportContent.replace(/\n/g, '<br>')}</div>`);
          e.dataTransfer.setData('text', exportContent); // Legacy format
          e.dataTransfer.setData('Text', exportContent); // Alternative format
          
          // For rich text applications
          const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 ${exportContent.replace(/\n/g, '\\par ')}}`;
          e.dataTransfer.setData('text/rtf', rtfContent);
          
          e.dataTransfer.effectAllowed = 'copy';
          e.dataTransfer.dropEffect = 'copy';
          
          console.log('Dragging subtask content to external application:', isFromExportButton ? 'with full context' : 'processed content only');
          console.log('Export content length:', exportContent.length);
          console.log('Available data types:', e.dataTransfer.types);
        } catch (error) {
          console.error('Error setting drag data:', error);
        }
        
        // Set custom drag image for better visual feedback
        const dragImage = document.createElement('div');
        dragImage.innerHTML = `${title} - ${isFromExportButton ? 'Full Context' : 'Subtask Content'}`;
        dragImage.style.cssText = 'position: absolute; top: -1000px; left: -1000px; background: white; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 9999;';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 10, 10);
        setTimeout(() => {
          if (document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
          }
        }, 100);
      }}
    >
      {/* Drag handle for entire subtask */}
      <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
        <GripVertical className="h-5 w-5 text-gray-500" />
      </div>

      <div className="mb-4">
        <div className="flex items-start justify-between mb-2 gap-4">
          <h3 
            className="text-lg font-semibold text-gray-900 flex-shrink-0 cursor-grab active:cursor-grabbing"
            draggable={true}
            onDragStart={(e) => {
              e.stopPropagation();
              // Always drag full subtask when dragging from title
              let exportContent = description;
              
              // Apply processing logic
              if (flaggedSections.size > 0 || Object.keys(sectionComments).length > 0) {
                let processedSections = [];
                
                for (let i = 0; i < sections.length; i++) {
                  if (flaggedSections.has(i)) continue;
                  
                  let sectionText = sections[i];
                  if (sectionComments[i] && sectionComments[i].length > 0 && !cautionSections.has(i)) {
                    const commentTexts = sectionComments[i].map(comment => comment.content).join('\n');
                    sectionText = commentTexts;
                  }
                  processedSections.push(sectionText);
                }
                exportContent = processedSections.join('\n\n');
              }
              
              e.dataTransfer.clearData();
              e.dataTransfer.setData('text/plain', exportContent);
              e.dataTransfer.setData('text/html', `<div>${exportContent.replace(/\n/g, '<br>')}</div>`);
              e.dataTransfer.setData('text', exportContent);
              e.dataTransfer.effectAllowed = 'copy';
              
              console.log('Dragging full subtask from title:', exportContent.substring(0, 100));
            }}
            title="Drag to copy entire subtask to external applications"
          >
            {title}
          </h3>
          
          {/* Section combination controls */}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end min-w-0">
            {showExportButton && (
              <Button
                size="sm"
                variant="outline"
                onClick={exportSubtask}
                onContextMenu={(e) => {
                  e.preventDefault();
                  exportFullContext();
                }}
                className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-300 text-xs sm:text-sm whitespace-nowrap cursor-grab active:cursor-grabbing"
                title="Left-click: Export subtask only | Right-click: Export full context with project, task, and subtask details | Drag: Copy to external applications (drag from here for full context)"
              >
                <Copy className="h-3 w-3" />
                <GripVertical className="h-3 w-3 opacity-60" />
                <span className="hidden xs:inline">Export</span>
              </Button>
            )}
            
            <Button
              size="sm"
              variant={isSelectionMode ? "default" : "outline"}
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
              }}
              className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap"
            >
              <MousePointer className="h-3 w-3" />
              <span className="hidden sm:inline">{isSelectionMode ? "Exit Selection" : "Select Sections"}</span>
              <span className="sm:hidden">{isSelectionMode ? "Exit" : "Select"}</span>
            </Button>
            
            {/* Debug info - Always show current selection count */}
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
              <span className="hidden sm:inline">Selected: </span>{selectedSections.size}
            </div>
            
            {selectedSections.size > 1 && (
              <Button
                size="sm"
                onClick={combineSections}
                disabled={isSaving}
                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap"
              >
                <Link className="h-3 w-3" />
                <span className="hidden sm:inline">{isSaving ? 'Saving...' : `Combine (${selectedSections.size})`}</span>
                <span className="sm:hidden">{isSaving ? 'Save' : `(${selectedSections.size})`}</span>
              </Button>
            )}
            
            {selectedSections.size > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                className="flex items-center gap-1 text-gray-600 text-xs sm:text-sm whitespace-nowrap"
              >
                <X className="h-3 w-3" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
            
            {hasUnsavedChanges && !onDescriptionChange && (
              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Changes not saved
              </div>
            )}
            
            {/* Debug test button for drag functionality */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // Test clipboard functionality as an alternative
                const testContent = description.substring(0, 200) + "...";
                navigator.clipboard.writeText(testContent).then(() => {
                  toast({
                    title: "Test Copy Successful",
                    description: "Basic clipboard functionality works. If drag doesn't work, this is a browser/OS limitation.",
                  });
                }).catch((error) => {
                  toast({
                    title: "Test Copy Failed",
                    description: "Clipboard functionality not available: " + error.message,
                    variant: "destructive",
                  });
                });
              }}
              className="text-xs text-gray-500"
              title="Test basic copy functionality"
            >
              Test Copy
            </Button>
          </div>
        </div>
        
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          {isSelectionMode 
            ? "Tap sections to select them, then combine. Purple sections are selected." 
            : "Tap any section to enter selection mode. Drag sections to external apps, or Ctrl/Cmd+drag for full subtask. If drag doesn't work, content will auto-copy to clipboard. On desktop: hover for action buttons."
          }
        </p>
      </div>

      <div className="space-y-2">
        {sections.map((section, index) => renderSection(section, index))}
      </div>

      {/* Comment functionality removed - handled by SubtaskComments component */}
    </div>
  );
}