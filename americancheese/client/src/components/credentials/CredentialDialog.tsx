import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Key, Lock, Database, FileKey } from "lucide-react";

interface Credential {
  id: number;
  name: string;
  category: string;
  website: string | null;
  username: string | null;
  notes: string | null;
  expiresAt: string | null;
}

interface CredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential: Credential | null;
}

const categoryOptions = [
  { value: "api_key", label: "API Key", icon: Key },
  { value: "password", label: "Password", icon: Lock },
  { value: "connection_string", label: "Connection String", icon: Database },
  { value: "certificate", label: "Certificate", icon: FileKey },
  { value: "other", label: "Other", icon: Lock },
];

export function CredentialDialog({ open, onOpenChange, credential }: CredentialDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showValue, setShowValue] = useState(false);

  const isEditing = !!credential;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "password",
    website: "",
    username: "",
    value: "",
    notes: "",
    expiresAt: "",
  });

  // Populate form when editing
  useEffect(() => {
    if (credential) {
      setFormData({
        name: credential.name || "",
        category: credential.category || "password",
        website: credential.website || "",
        username: credential.username || "",
        value: "", // Never pre-populate value for security
        notes: credential.notes || "",
        expiresAt: credential.expiresAt ? credential.expiresAt.split('T')[0] : "",
      });
    } else {
      // Reset form for new credential
      setFormData({
        name: "",
        category: "password",
        website: "",
        username: "",
        value: "",
        notes: "",
        expiresAt: "",
      });
    }
    setShowValue(false);
  }, [credential, open]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/credentials", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast({
        title: "Success",
        description: "Credential created successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Error creating credential:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create credential",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      return apiRequest(`/api/credentials/${credential?.id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast({
        title: "Success",
        description: "Credential updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Error updating credential:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update credential",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!isEditing && !formData.value.trim()) {
      toast({
        title: "Validation Error",
        description: "Credential value is required",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      // Only send changed fields
      const updateData: Partial<typeof formData> = {
        name: formData.name,
        category: formData.category,
        website: formData.website || undefined,
        username: formData.username || undefined,
        notes: formData.notes || undefined,
        expiresAt: formData.expiresAt || undefined,
      };
      // Only update value if provided
      if (formData.value.trim()) {
        updateData.value = formData.value;
      }
      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Credential" : "Add New Credential"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the credential details. Leave the value empty to keep the existing value."
              : "Store a new credential securely. The value will be encrypted."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., LinkedIn API Key"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website / Service URL</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://api.example.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username / Email</Label>
            <Input
              id="username"
              placeholder="Optional username or email"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          {/* Value (Password/API Key/etc) */}
          <div className="space-y-2">
            <Label htmlFor="value">
              {isEditing ? "New Value (leave empty to keep current)" : "Value *"}
            </Label>
            <div className="relative">
              <Input
                id="value"
                type={showValue ? "text" : "password"}
                placeholder={isEditing ? "Enter new value to update" : "Enter the credential value"}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowValue(!showValue)}
              >
                {showValue ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
            <Input
              id="expiresAt"
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes about this credential"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
