/**
 * Preset Availability Component
 * 
 * Allows admins to toggle which presets are available for project selection.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Eye, EyeOff, Package } from "lucide-react";
import { AVAILABLE_PRESETS } from "@shared/presets";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EnabledPresetsResponse {
  enabledPresets: string[];
}

export function PresetAvailability() {
  const { toast } = useToast();
  const [enabledPresets, setEnabledPresets] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const allPresetKeys = Object.keys(AVAILABLE_PRESETS);

  // Fetch enabled presets
  const { data: enabledPresetsData, isLoading } = useQuery<EnabledPresetsResponse>({
    queryKey: ['/api/global-settings/enabled-presets'],
  });

  // Initialize state when data loads
  useEffect(() => {
    if (enabledPresetsData) {
      // Empty array means all presets are enabled
      if (enabledPresetsData.enabledPresets.length === 0) {
        setEnabledPresets(allPresetKeys);
      } else {
        setEnabledPresets(enabledPresetsData.enabledPresets);
      }
    }
  }, [enabledPresetsData]);

  // Update enabled presets mutation
  const updateMutation = useMutation({
    mutationFn: async (presets: string[]) => {
      return apiRequest('/api/global-settings/enabled-presets', {
        method: 'PUT',
        body: JSON.stringify({ enabledPresets: presets }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-settings/enabled-presets'] });
      setHasChanges(false);
      toast({
        title: "Preset availability updated",
        description: "Project preset options have been saved.",
      });
    },
    onError: (error) => {
      console.error('Error updating enabled presets:', error);
      toast({
        title: "Error",
        description: "Failed to update preset availability.",
        variant: "destructive",
      });
    }
  });

  const handleToggle = (presetKey: string, enabled: boolean) => {
    setEnabledPresets(prev => {
      const currentPresets = prev.length === 0 ? allPresetKeys : prev;
      if (enabled) {
        return [...currentPresets, presetKey];
      } else {
        // Allow disabling all presets (users can still use "None" option)
        return currentPresets.filter(p => p !== presetKey);
      }
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    const presetsToSave = enabledPresets.length === allPresetKeys.length ? [] : enabledPresets;
    updateMutation.mutate(presetsToSave);
  };

  const handleEnableAll = () => {
    setEnabledPresets(allPresetKeys);
    setHasChanges(true);
  };

  const handleDisableAll = () => {
    setEnabledPresets([]);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const enabledCount = enabledPresets.length === 0 ? allPresetKeys.length : enabledPresets.length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Preset Availability
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Control which presets are available when creating new projects.
          Disabled presets will be hidden from the preset selector.
          The "None" option is always available.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {enabledCount} of {allPresetKeys.length} presets enabled
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEnableAll}>
            Enable All
          </Button>
          <Button variant="outline" size="sm" onClick={handleDisableAll}>
            Disable All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(AVAILABLE_PRESETS).map(([presetKey, preset]) => {
          const isEnabled = enabledPresets.length === 0 || enabledPresets.includes(presetKey);

          return (
            <div
              key={presetKey}
              className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                isEnabled ? 'bg-card' : 'bg-muted/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{preset.name}</span>
                  <span className="text-sm text-muted-foreground truncate max-w-[250px]">
                    {preset.description}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {preset.categories.tier1.length} categories
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEnabled ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleToggle(presetKey, checked)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {hasChanges && (
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            You have unsaved changes.
          </span>
        </div>
      )}
    </div>
  );
}

export default PresetAvailability;


