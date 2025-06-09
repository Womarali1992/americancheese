import React, { useState } from 'react';
import { MessageCircle, Plus, Edit2, Trash2, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ChecklistItemComment, InsertChecklistItemComment } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChecklistItemCommentsProps {
  checklistItemId: number;
  checklistItemTitle: string;
}

export function ChecklistItemComments({ checklistItemId, checklistItemTitle }: ChecklistItemCommentsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [editingComment, setEditingComment] = useState<ChecklistItemComment | null>(null);
  const [editContent, setEditContent] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments for this checklist item
  const { data: comments = [], isLoading } = useQuery<ChecklistItemComment[]>({
    queryKey: [`/api/checklist-items/${checklistItemId}/comments`],
    enabled: checklistItemId > 0,
  });

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertChecklistItemComment) => 
      apiRequest(`/api/checklist-items/${checklistItemId}/comments`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/checklist-items/${checklistItemId}/comments`] });
      setNewComment('');
      setAuthorName('');
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
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertChecklistItemComment> }) =>
      apiRequest(`/api/checklist/comments/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/checklist-items/${checklistItemId}/comments`] });
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
    mutationFn: (id: number) =>
      apiRequest(`/api/checklist/comments/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/checklist-items/${checklistItemId}/comments`] });
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

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both comment and author name",
        variant: "destructive",
      });
      return;
    }

    const commentData: InsertChecklistItemComment = {
      checklistItemId,
      content: newComment.trim(),
      authorName: authorName.trim(),
    };

    createMutation.mutate(commentData);
  };

  const handleEditComment = (comment: ChecklistItemComment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  const handleSaveEdit = () => {
    if (!editingComment || !editContent.trim()) return;

    updateMutation.mutate({
      id: editingComment.id,
      data: { content: editContent.trim() }
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate(commentId);
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
          <MessageCircle className="h-4 w-4 mr-1" />
          Comments ({comments.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments: {checklistItemTitle}</DialogTitle>
          <DialogDescription>
            Add and manage comments for this checklist item
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Add new comment form */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Add Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddComment} className="space-y-3">
                <Input
                  placeholder="Your name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  required
                />
                <Textarea
                  placeholder="Write your comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  required
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {createMutation.isPending ? 'Adding...' : 'Add Comment'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Comments list */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No comments yet. Be the first to add one!
              </div>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="relative">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {comment.authorName}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditComment(comment)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {editingComment?.id === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={updateMutation.isPending}
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
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.comment}
                      </p>
                    )}

                    {comment.updatedAt !== comment.createdAt && (
                      <div className="mt-2 text-xs text-gray-400">
                        Edited: {formatDate(comment.updatedAt)}
                      </div>
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