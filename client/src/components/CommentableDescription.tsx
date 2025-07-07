import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X, Link, Unlink, MousePointer } from 'lucide-react';
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
  }, [description]);

  const handleSectionClick = (sectionId: number) => {
    if (isSelectionMode) {
      toggleSectionSelection(sectionId);
    } else {
      openCommentBox(sectionId);
    }
  };

  const openCommentBox = (sectionId: number) => {
    setActiveSection(sectionId);
    setIsDialogOpen(true);
  };

  const toggleSectionSelection = (sectionId: number) => {
    setSelectedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
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
    
    return (
      <div
        key={index}
        data-section-id={index}
        className={`clickable-section relative group border rounded-lg p-4 mb-4 transition-all duration-200 ${
          isSelected 
            ? 'border-purple-400 bg-purple-50 shadow-md' 
            : sectionComments.length > 0 
              ? 'border-blue-200 bg-blue-50' 
              : 'border-gray-200'
        } ${
          isSelectionMode 
            ? 'cursor-crosshair hover:border-purple-300 hover:bg-purple-100' 
            : 'cursor-pointer hover:bg-gray-50 hover:border-gray-300'
        }`}
        onClick={() => handleSectionClick(index)}
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
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isSelectionMode ? "default" : "outline"}
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className="flex items-center gap-1"
            >
              <MousePointer className="h-3 w-3" />
              {isSelectionMode ? "Exit Selection" : "Select Sections"}
            </Button>
            
            {selectedSections.size > 1 && (
              <Button
                size="sm"
                onClick={combineSections}
                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700"
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
            ? "Click sections to select them, then combine. Purple sections are selected." 
            : "Click on any section to add comments. Orange separate button splits combined sections."
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