import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { useProjectTheme } from '@/hooks/useProjectTheme';
import { useTheme } from '@/hooks/useTheme';
import { MarkdownContent } from '@/components/ui/markdown-editor';

interface CategoryDescriptionListProps {
  projectId?: number;
  hiddenCategories?: string[];
}

export const CategoryDescriptionList: React.FC<CategoryDescriptionListProps> = ({
  projectId,
  hiddenCategories = []
}) => {
  // Initialize project theme system to get project-specific colors
  const { theme: currentTheme } = useProjectTheme(projectId);
  const { getColor } = useTheme(projectId);

  // Fetch project categories from the unified API
  const { data: projectCategories, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/categories/flat`],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const response = await fetch(`/api/projects/${projectId}/categories/flat`);
      if (!response.ok) {
        throw new Error('Failed to fetch project categories');
      }
      return response.json();
    },
    enabled: !!projectId
  });

  // Get tier1 and tier2 categories from the API data
  const tier1Categories = projectCategories?.filter((cat: any) => cat.type === 'tier1') || [];
  const tier2Categories = projectCategories?.filter((cat: any) => cat.type === 'tier2') || [];

  // Filter out hidden categories
  const visibleTier1Categories = tier1Categories.filter((cat: any) =>
    cat.name && !hiddenCategories.includes(cat.name.toLowerCase())
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-lg bg-card overflow-hidden animate-pulse">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-5 bg-slate-200 rounded-sm mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-48"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visibleTier1Categories.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        No category descriptions available
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-3">
      {visibleTier1Categories.map((tier1Cat: any, index: number) => {
        if (!tier1Cat.name) return null;

        // Use theme colors based on the project's selected theme, with fallback to index-based colors
        const tier1Color = tier1Cat.color ||
          currentTheme?.subcategories?.[index % (currentTheme?.subcategories?.length || 1)] ||
          currentTheme?.primary ||
          '#64748b';

        // Get subcategories for this category
        const relatedTier2Categories = tier2Categories.filter((tier2: any) => tier2.parentId === tier1Cat.id);

        return (
          <AccordionItem
            key={tier1Cat.id}
            value={tier1Cat.id.toString()}
            className="border rounded-lg bg-card overflow-hidden"
          >
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-5 rounded-sm mr-3" style={{ backgroundColor: tier1Color }}></div>
                <AccordionTrigger className="p-0 hover:no-underline flex-1 text-left">
                  <div>
                    <h4 className="font-semibold text-base">{tier1Cat.name}</h4>
                    {tier1Cat.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        <MarkdownContent content={tier1Cat.description} className="prose-sm" />
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
              </div>
            </div>

            <AccordionContent className="px-4 pb-4">
              {relatedTier2Categories.length > 0 ? (
                <div className="space-y-3 mt-3 pt-3 border-t">
                  <h5 className="text-sm font-medium text-muted-foreground">Subcategories:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {relatedTier2Categories.map((tier2Cat: any, tier2Index: number) => {
                      if (!tier2Cat.name) return null;

                      // Always calculate tier2 color from parent tier1 category for consistency
                      // Database colors are ignored to ensure colors match the project theme
                      const tier2Color = getColor.tier2(tier2Cat.name, tier1Cat.name);

                      return (
                        <div key={tier2Cat.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div
                            className="w-1.5 h-4 rounded-sm flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: tier2Color }}
                          ></div>
                          <div className="min-w-0 flex-1">
                            <h6 className="font-medium text-sm">{tier2Cat.name}</h6>
                            {tier2Cat.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <MarkdownContent content={tier2Cat.description} className="prose-xs" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4 mt-3 border-t">
                  No subcategories defined
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};