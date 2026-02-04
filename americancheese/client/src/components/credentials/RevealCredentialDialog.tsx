import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Copy, Check, Lock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Credential {
  id: number;
  name: string;
  category: string;
  website: string | null;
  username: string | null;
}

interface RevealCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential: Credential | null;
}

export function RevealCredentialDialog({ open, onOpenChange, credential }: RevealCredentialDialogProps) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [showValue, setShowValue] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPassword("");
      setRevealedValue(null);
      setShowValue(false);
      setCopied(false);
      setError(null);
    }
  }, [open]);

  // Reveal mutation
  const revealMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/credentials/${credential?.id}/reveal`, "POST", { password });
      return response;
    },
    onSuccess: (data: any) => {
      setRevealedValue(data.value);
      setShowValue(true);
      setError(null);
      toast({
        title: "Credential Revealed",
        description: "The credential value has been decrypted",
      });
    },
    onError: (error: any) => {
      console.error("Error revealing credential:", error);
      setError(error.message || "Invalid password or failed to reveal credential");
      setRevealedValue(null);
    }
  });

  const handleReveal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }
    revealMutation.mutate();
  };

  const handleCopy = async () => {
    if (revealedValue) {
      try {
        await navigator.clipboard.writeText(revealedValue);
        setCopied(true);
        toast({
          title: "Copied",
          description: "Credential copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Reveal Credential
          </DialogTitle>
          <DialogDescription>
            {credential?.name}
          </DialogDescription>
        </DialogHeader>

        {!revealedValue ? (
          // Password entry form
          <form onSubmit={handleReveal} className="space-y-4 py-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                For security, please re-enter your account password to reveal this credential.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="password">Your Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={revealMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={revealMutation.isPending}>
                {revealMutation.isPending ? "Verifying..." : "Reveal"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          // Revealed value display
          <div className="space-y-4 py-4">
            {credential?.username && (
              <div className="space-y-2">
                <Label>Username</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={credential.username}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(credential.username || "");
                      toast({ title: "Username copied" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Credential Value</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showValue ? "text" : "password"}
                    value={revealedValue}
                    readOnly
                    className="pr-10 font-mono bg-gray-50"
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {credential?.website && (
              <div className="space-y-2">
                <Label>Website</Label>
                <a
                  href={credential.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline block"
                >
                  {credential.website}
                </a>
              </div>
            )}

            <Alert className="bg-blue-50 border-blue-200 mt-4">
              <Lock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                This credential will be hidden when you close this dialog.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
