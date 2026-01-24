import React, { useState, useMemo } from 'react';
import { MessageCircle, Plus, Edit2, Trash2, Send, X, Reply, CornerDownRight } from 'lucide-react';
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
  const [replyingTo, setReplyingTo] = useState<ChecklistItemComment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');

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

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyAuthor.trim() || !replyingTo) {
      toast({
        title: "Error",
        description: "Please fill in both reply and author name",
        variant: "destructive",
      });
      return;
    }

    const commentData: InsertChecklistItemComment = {
      checklistItemId,
      content: replyContent.trim(),
      authorName: replyAuthor.trim(),
      parentId: replyingTo.id,
    };

    createMutation.mutate(commentData, {
      onSuccess: () => {
        setReplyingTo(null);
        setReplyContent('');
        setReplyAuthor('');
      }
    });
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  // Organize comments into threads (parent comments with their replies)
  const { parentComments, repliesByParent } = useMemo(() => {
    const parents = comments.filter(c => !c.parentId);
    const replies: Record<number, ChecklistItemComment[]> = {};
    
    comments.filter(c => c.parentId).forEach(reply => {
      if (!replies[reply.parentId!]) {
        replies[reply.parentId!] = [];
      }
      replies[reply.parentId!].push(reply);
    });
    
    // Sort replies by date
    Object.keys(replies).forEach(key => {
      replies[parseInt(key)].sort((a, b) => 
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );
    });
    
    return { parentComments: parents, repliesByParent: replies };
  }, [comments]);

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
              parentComments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <Card className="relative">
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
                            onClick={() => {
                              setReplyingTo(comment);
                              setReplyAuthor(authorName);
                            }}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                            title="Reply"
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
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
                          {comment.content}
                        </p>
                      )}

                      {comment.updatedAt !== comment.createdAt && (
                        <div className="mt-2 text-xs text-gray-400">
                          Edited: {formatDate(comment.updatedAt)}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Reply form for this comment */}
                  {replyingTo?.id === comment.id && (
                    <div className="ml-6 border-l-2 border-blue-200 pl-4">
                      <Card className="bg-blue-50">
                        <CardContent className="pt-4">
                          <form onSubmit={handleReply} className="space-y-2">
                            <div className="text-xs text-gray-500 mb-2">
                              Replying to {comment.authorName}
                            </div>
                            <Input
                              placeholder="Your name"
                              value={replyAuthor}
                              onChange={(e) => setReplyAuthor(e.target.value)}
                              required
                              className="bg-white"
                            />
                            <Textarea
                              placeholder="Write your reply..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              rows={2}
                              required
                              className="bg-white"
                            />
                            <div className="flex gap-2">
                              <Button 
                                type="submit" 
                                size="sm" 
                                disabled={createMutation.isPending}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Reply
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Replies to this comment */}
                  {repliesByParent[comment.id]?.map((reply) => (
                    <div key={reply.id} className="ml-6 border-l-2 border-gray-200 pl-4">
                      <Card className="bg-gray-50">
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <CornerDownRight className="h-3 w-3 text-gray-400" />
                              <Badge variant="outline" className="text-xs">
                                {reply.authorName}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditComment(reply)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(reply.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {editingComment?.id === reply.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={2}
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
                            <p className="text-sm text-gray-700 whitespace-pre-wrap ml-5">
                              {reply.content}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}