import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X, Link, Unlink, MousePointer, Plus, Minus, ArrowDown, AlertTriangle, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Comment {
  id: number;
  sectionId: number;
  content: string;
  authorName: string;
  createdAt: string;
}

interface CommentableDescriptionProps {
  description: string;
  title?: string;
  className?: string;
}

export function CommentableDescription({ 
  description, 
  title = "Document", 
  className = "" 
}: CommentableDescriptionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
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
  const [combinedSections, setCombinedSections] = useState<Set<number>>(new Set());

  // Reset sections when description changes
  useEffect(() => {
    const newSections = description.split(
      /\n{2,}|(?=^#{1,2}\s)|(?=^\s*[-*]\s)|(?=^\s*\d+\.\s)/gm
    ).filter(Boolean);
    setSections(newSections);
    setCombinedSections(new Set());
    setSelectedSections(new Set());
    setCautionSections(new Set());
    setFlaggedSections(new Set());
  }, [description]);

  const handleSectionClick = (sectionId: number) => {
    console.log('Section clicked:', sectionId, 'Selection mode:', isSelectionMode);
    if (isSelectionMode) {
      console.log('In selection mode - toggling selection');
      toggleSectionSelection(sectionId);
    } else {
      console.log('In comment mode - opening comment box');
      openCommentBox(sectionId);
    }
  };

  const openCommentBox = (sectionId: number) => {
    setActiveSection(sectionId);
    setIsDialogOpen(true);
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

  const combineToSection = (endSectionId: number) => {
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
    setCombinedSections(prev => new Set([...prev, startIdx]));
    setSelectedSections(new Set());
    setFirstSelectedSection(null);
    
    console.log(`Combined ${endIdx - startIdx + 1} sections into section ${startIdx}`);
  };

  const combineSections = () => {
    if (selectedSections.size < 2) return;

    const sortedIds = Array.from(selectedSections).sort((a, b) => a - b);
    const combinedText = sortedIds.map(id => sections[id]).join('\n\n');
    
    // Create new sections array with combined sections
    const newSections = [...sections];
    newSections[sortedIds[0]] = combinedText;
    
    // Remove the other sections (in reverse order to maintain indices)
    for (let i = sortedIds.length - 1; i > 0; i--) {
      newSections.splice(sortedIds[i], 1);
    }
    
    setSections(newSections);
    setCombinedSections(prev => new Set([...prev, sortedIds[0]]));
    setSelectedSections(new Set());
    setIsSelectionMode(false);
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
    setCombinedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedSections(new Set());
    setIsSelectionMode(false);
  };

  const toggleCautionSection = (sectionId: number) => {
    setCautionSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        // Remove from flagged if it was flagged (can't be both)
        setFlaggedSections(flagPrev => {
          const newFlagSet = new Set(flagPrev);
          newFlagSet.delete(sectionId);
          return newFlagSet;
        });
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const toggleFlaggedSection = (sectionId: number) => {
    setFlaggedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        // Remove from caution if it was cautioned (can't be both)
        setCautionSections(cautionPrev => {
          const newCautionSet = new Set(cautionPrev);
          newCautionSet.delete(sectionId);
          return newCautionSet;
        });
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const addComment = () => {
    if (!newComment.trim() || !authorName.trim() || activeSection === null) return;

    const comment: Comment = {
      id: Date.now(),
      sectionId: activeSection,
      content: newComment.trim(),
      authorName: authorName.trim(),
      createdAt: new Date().toISOString(),
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    setAuthorName('');
    setIsDialogOpen(false);
  };

  const getSectionComments = (sectionId: number) => {
    return comments.filter(comment => comment.sectionId === sectionId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderSection = (section: string, index: number) => {
    const sectionComments = getSectionComments(index);
    const isCodeBlock = section.trim().startsWith('```') && section.trim().endsWith('```');
    const isSelected = selectedSections.has(index);
    const isCombined = combinedSections.has(index);
    const isCaution = cautionSections.has(index);
    const isFlagged = flaggedSections.has(index);
    
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
    } else if (sectionComments.length > 0) {
      borderColor = 'border-blue-200';
      backgroundColor = 'bg-blue-50';
    }
    
    return (
      <div
        key={index}
        data-section-id={index}
        className={`clickable-section relative group border-2 rounded-lg p-4 mb-4 transition-all duration-200 ${borderColor} ${backgroundColor} ${
          isSelectionMode 
            ? 'cursor-crosshair hover:border-purple-300 hover:bg-purple-100' 
            : 'cursor-pointer hover:bg-gray-50 hover:border-gray-300'
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSectionClick(index);
        }}
      >
        {/* Section content */}
        <div className={`${isCodeBlock ? 'font-mono text-sm' : ''}`}>
          {isCodeBlock ? (
            <pre className="whitespace-pre-wrap overflow-x-auto">
              <code>{section}</code>
            </pre>
          ) : (
            <div className="whitespace-pre-wrap">{section}</div>
          )}
        </div>

        {/* Section controls */}
        <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
          
          {/* Comment indicator */}
          <MessageCircle className="h-4 w-4 text-gray-500" />
          {sectionComments.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {sectionComments.length}
            </Badge>
          )}
        </div>

        {/* Show existing comments for this section */}
        {sectionComments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Comments ({sectionComments.length}):
            </div>
            {sectionComments.map(comment => (
              <div key={comment.id} className="mb-2 p-2 bg-white rounded border">
                <div className="text-sm font-medium text-gray-800">
                  {comment.authorName}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {comment.content}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatDate(comment.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`commentable-description ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          
          {/* Section combination controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={isSelectionMode ? "default" : "outline"}
              onClick={() => {
                if (!isSelectionMode) {
                  // Entering selection mode - close any open comment dialog
                  setIsDialogOpen(false);
                  setActiveSection(null);
                }
                setIsSelectionMode(!isSelectionMode);
              }}
              className="flex items-center gap-1"
            >
              <MousePointer className="h-3 w-3" />
              {isSelectionMode ? "Exit Selection" : "Select Sections"}
            </Button>
            
            {/* Debug info - Always show current selection count */}
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Selected: {selectedSections.size}
            </div>
            
            {selectedSections.size > 1 && (
              <Button
                size="sm"
                onClick={combineSections}
                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Link className="h-3 w-3" />
                Combine ({selectedSections.size})
              </Button>
            )}
            
            {selectedSections.size > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                className="flex items-center gap-1 text-gray-600"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          {isSelectionMode 
            ? "Click sections to select them, then combine. Purple sections are selected. Use cursor button on hover for quick selection." 
            : "Click on any section to add comments. Hover for: cursor (select), triangle (caution/yellow), flag (important/red), green arrow (combine to here)."
          } Total comments: {comments.length}
        </p>
      </div>

      <div className="space-y-2">
        {sections.map((section, index) => renderSection(section, index))}
      </div>

      {/* Comment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Add Comment to Section {activeSection !== null ? activeSection + 1 : ''}
            </DialogTitle>
            <DialogDescription>
              Add a comment to this section. Your comment will be visible to others.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show the section being commented on */}
            {activeSection !== null && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm font-medium text-gray-700 mb-2">Section:</div>
                <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                  {sections[activeSection]?.substring(0, 200)}
                  {sections[activeSection]?.length > 200 && '...'}
                </div>
              </div>
            )}

            {/* Show existing comments for this section */}
            {activeSection !== null && getSectionComments(activeSection).length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Existing Comments ({getSectionComments(activeSection).length}):
                </div>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {getSectionComments(activeSection).map(comment => (
                    <Card key={comment.id} className="p-3">
                      <div className="text-sm font-medium text-gray-800">
                        {comment.authorName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {comment.content}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(comment.createdAt)}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Add new comment form */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Add New Comment:</div>
              <Input
                placeholder="Your name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
              <Textarea
                placeholder="Enter your comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={addComment}
                  disabled={!newComment.trim() || !authorName.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}