import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Mail, X, Crown, Shield, Pencil, Eye, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ProjectMember {
  id: number;
  projectId: number;
  userId: number | null;
  role: string;
  invitedEmail: string;
  status: string;
  invitedAt: string | null;
  acceptedAt: string | null;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

interface ShareProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  projectName: string;
  isOwner: boolean;
  userRole: string | null;
}

export function ShareProjectDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  isOwner,
  userRole,
}: ShareProjectDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor" | "admin">("viewer");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current members
  const { data: members = [], isLoading } = useQuery<ProjectMember[]>({
    queryKey: [`/api/projects/${projectId}/members`],
    enabled: open,
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      const res = await apiRequest(`/api/projects/${projectId}/members/invite`, "POST", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Invitation sent", description: `Invitation sent to ${email}` });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "members"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: number; role: string }) => {
      const res = await apiRequest(`/api/projects/${projectId}/members/${memberId}`, "PUT", { role });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Role updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "members"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const res = await apiRequest(`/api/projects/${projectId}/members/${memberId}`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Member removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "members"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const canManageMembers = isOwner || userRole === "admin";
  const canInviteAdmins = isOwner;

  const getRoleIcon = (memberRole: string) => {
    switch (memberRole) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "editor":
        return <Pencil className="h-4 w-4 text-green-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || "?";
  };

  const handleInvite = () => {
    if (!email.trim()) return;
    inviteMutation.mutate({ email: email.trim(), role });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share Project
          </DialogTitle>
          <DialogDescription>
            Invite team members to collaborate on "{projectName}".
          </DialogDescription>
        </DialogHeader>

        {/* Invite Form */}
        {canManageMembers && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInvite();
                  }
                }}
              />
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  {canInviteAdmins && <SelectItem value="admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleInvite}
              disabled={!email.trim() || inviteMutation.isPending}
              className="w-full"
            >
              {inviteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send Invitation
            </Button>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Project Members ({members.length})
          </h4>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No members yet. Invite someone to collaborate!
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.user?.name, member.invitedEmail)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.user?.name || member.invitedEmail}
                      </p>
                      {member.user?.name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {member.invitedEmail}
                        </p>
                      )}
                      {member.status === "pending" && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role !== "owner" && canManageMembers ? (
                      <Select
                        value={member.role}
                        onValueChange={(newRole) => {
                          if (member.id !== 0) {
                            updateRoleMutation.mutate({ memberId: member.id, role: newRole });
                          }
                        }}
                        disabled={member.id === 0 || updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            <span className="capitalize">{member.role}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-2">
                              <Eye className="h-3 w-3" />
                              Viewer
                            </div>
                          </SelectItem>
                          <SelectItem value="editor">
                            <div className="flex items-center gap-2">
                              <Pencil className="h-3 w-3" />
                              Editor
                            </div>
                          </SelectItem>
                          {canInviteAdmins && (
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3" />
                                Admin
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-1 px-2 text-sm text-muted-foreground">
                        {getRoleIcon(member.role)}
                        <span className="capitalize">{member.role}</span>
                      </div>
                    )}
                    {canManageMembers && member.role !== "owner" && member.id !== 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMutation.mutate(member.id)}
                        disabled={removeMutation.isPending}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permission Legend */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Permission levels:</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Crown className="h-3 w-3 text-yellow-500" />
              <span>Owner - Full control</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-blue-500" />
              <span>Admin - Manage members</span>
            </div>
            <div className="flex items-center gap-1">
              <Pencil className="h-3 w-3 text-green-500" />
              <span>Editor - Edit project</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-gray-500" />
              <span>Viewer - View only</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
