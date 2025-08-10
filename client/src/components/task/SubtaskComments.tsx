import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Plus, Edit2, Trash2, Send, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { SubtaskComment, InsertSubtaskComment, Contact } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SubtaskCommentsProps {
  subtaskId: number;
  subtaskTitle: string;
  sectionId?: number; // Optional: if provided, only show comments for this section
  sectionContent?: string; // Optional: content of the section being commented on
  onDialogClose?: () => void; // Optional callback when dialog closes
}

export function SubtaskComments({ subtaskId, subtaskTitle, sectionId, sectionContent, onDialogClose }: SubtaskCommentsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [editingComment, setEditingComment] = useState<SubtaskComment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [contactsVisible, setContactsVisible] = useState(true);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments for this subtask
  const { data: allComments = [], isLoading } = useQuery<SubtaskComment[]>({
    queryKey: [`/api/subtasks/${subtaskId}/comments`],
    enabled: subtaskId > 0,
  });

  // Filter comments based on sectionId if provided
  const comments = React.useMemo(() => {
    if (sectionId !== undefined) {
      return allComments.filter(comment => comment.sectionId === sectionId);
    }
    // When no sectionId is provided, show only overall subtask comments (where sectionId is null)
    return allComments.filter(comment => comment.sectionId === null);
  }, [allComments, sectionId]);

  // Fetch contacts for quick name selection
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertSubtaskComment) => 
      apiRequest(`/api/subtasks/${subtaskId}/comments`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subtasks/${subtaskId}/comments`] });
      // Also invalidate comment count queries for the parent task
      queryClient.invalidateQueries({ queryKey: [`/api/tasks`], predicate: (query) => 
        query.queryKey.some(key => typeof key === 'string' && key.includes('comment-counts'))
      });
      setNewComment('');
      setAuthorName('');
      setContactsVisible(true);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Update comment mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; content: string }) => 
      apiRequest(`/api/subtask/comments/${data.id}`, 'PUT', { content: data.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subtasks/${subtaskId}/comments`] });
      // Also invalidate comment count queries for the parent task
      queryClient.invalidateQueries({ queryKey: [`/api/tasks`], predicate: (query) => 
        query.queryKey.some(key => typeof key === 'string' && key.includes('comment-counts'))
      });
      setEditingComment(null);
      setEditContent('');
      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => 
      apiRequest(`/api/subtask/comments/${commentId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subtasks/${subtaskId}/comments`] });
      // Also invalidate comment count queries for the parent task
      queryClient.invalidateQueries({ queryKey: [`/api/tasks`], predicate: (query) => 
        query.queryKey.some(key => typeof key === 'string' && key.includes('comment-counts'))
      });
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim()) return;

    // Use the provided sectionId if available, otherwise null for overall subtask comments
    const commentSectionId = sectionId !== undefined ? sectionId : null;

    createMutation.mutate({
      subtaskId,
      content: newComment.trim(),
      authorName: authorName.trim(),
      sectionId: commentSectionId,
    });
  };

  const handleEdit = (comment: SubtaskComment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  const handleUpdate = () => {
    if (!editingComment || !editContent.trim()) return;

    updateMutation.mutate({
      id: editingComment.id,
      content: editContent.trim(),
    });
  };

  const handleDelete = (commentId: number) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate(commentId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageCircle className="h-4 w-4" />
        Loading comments...
      </div>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open && onDialogClose) {
        onDialogClose();
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
        >
          <MessageCircle className="h-4 w-4" />
          {comments.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {comments.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments for "{subtaskTitle}"
            {sectionId !== undefined && (
              <Badge variant="secondary" className="ml-2">
                Section {sectionId + 1}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {sectionId !== undefined 
              ? `Add and manage comments for Section ${sectionId + 1} of this subtask.`
              : "Add and manage comments for this subtask."
            }
          </DialogDescription>
        </DialogHeader>

        {/* Section Content Display */}
        {sectionId !== undefined && sectionContent && (
          <Card className="mb-4 bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Section {sectionId + 1}
                </Badge>
                Content
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto border-l-2 border-gray-300 pl-3">
                {sectionContent}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {/* Add new comment form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Add Comment
                {sectionId !== undefined && (
                  <Badge variant="outline" className="ml-2">
                    for Section {sectionId + 1}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Input
                    placeholder="Your name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                    className="mb-2"
                  />
                  {contactsVisible && contacts.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md">
                      {contacts.map((contact) => (
                        <Button
                          key={contact.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAuthorName(contact.name);
                            setContactsVisible(false);
                          }}
                          className="text-xs h-6 px-2"
                        >
                          {contact.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Textarea
                    placeholder="Write your comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={createMutation.isPending || !newComment.trim() || !authorName.trim()}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {createMutation.isPending ? 'Adding...' : 'Add Comment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Comments list */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to add one!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    {editingComment?.id === comment.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleUpdate}
                            disabled={updateMutation.isPending || !editContent.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingComment(null);
                              setEditContent('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{comment.authorName}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(comment.createdAt?.toString() || '')}
                            </span>
                            {comment.sectionId !== null && comment.sectionId !== undefined && (
                              <Badge variant="secondary" className="text-xs">
                                Section {comment.sectionId + 1}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(comment)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(comment.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm whitespace-pre-wrap">
                          {comment.content}
                        </div>
                        {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Edited {formatDate(comment.updatedAt.toString())}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}