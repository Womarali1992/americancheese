import React, { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
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

  // Split description into sections using the specified regex
  const sections = description.split(
    /\n{2,}|(?=^#{1,2}\s)|(?=^\s*[-*]\s)|(?=^\s*\d+\.\s)/gm
  ).filter(Boolean);

  const openCommentBox = (sectionId: number) => {
    setActiveSection(sectionId);
    setIsDialogOpen(true);
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
    
    return (
      <div
        key={index}
        data-section-id={index}
        className={`clickable-section relative group border rounded-lg p-4 mb-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 ${
          sectionComments.length > 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
        }`}
        onClick={() => openCommentBox(index)}
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

        {/* Comment indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">
          Click on any section to add comments. Total comments: {comments.length}
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