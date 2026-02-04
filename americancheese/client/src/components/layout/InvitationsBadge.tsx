import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, Check, X, FolderOpen, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Invitation {
  id: number;
  projectId: number;
  role: string;
  invitedEmail: string;
  status: string;
  invitedAt: string;
  project?: {
    id: number;
    name: string;
    location: string;
  };
}

export function InvitationsBadge() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending invitations
  const { data: invitations = [], isLoading } = useQuery<Invitation[]>({
    queryKey: ["/api/invitations"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Accept invitation
  const acceptMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const res = await apiRequest(`/api/invitations/${invitationId}/accept`, "POST");
      return res.json();
    },
    onSuccess: (_, invitationId) => {
      const invitation = invitations.find((i) => i.id === invitationId);
      toast({
        title: "Invitation accepted",
        description: `You now have access to "${invitation?.project?.name || "the project"}"`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Decline invitation
  const declineMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const res = await apiRequest(`/api/invitations/${invitationId}/decline`, "POST");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Invitation declined" });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const pendingCount = invitations.length;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "editor":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (pendingCount === 0 && !isLoading) {
    return null; // Don't show anything if no invitations
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Project Invitations
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {pendingCount}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No pending invitations
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-3 hover:bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {invitation.project?.name || "Unknown Project"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {invitation.project?.location || ""}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getRoleBadgeVariant(invitation.role)} className="text-xs">
                        {invitation.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 ml-13">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 h-8"
                    onClick={() => acceptMutation.mutate(invitation.id)}
                    disabled={acceptMutation.isPending || declineMutation.isPending}
                  >
                    {acceptMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8"
                    onClick={() => declineMutation.mutate(invitation.id)}
                    disabled={acceptMutation.isPending || declineMutation.isPending}
                  >
                    {declineMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
