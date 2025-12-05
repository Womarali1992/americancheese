import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { queryClient } from "@/lib/queryClient";
import { useProjectTheme } from "@/hooks/useProjectTheme";
import { FALLBACK_COLORS } from "@/lib/unified-color-system";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Tags,
  Edit2,
  Trash2,
  Save,
  X,
  GripVertical,
  Plus,
  ListTodo,
  MoreVertical,
  Copy,
  FileText,
  ChevronDown
} from "lucide-react";

interface CategoryManagerProps {
  projectId: number;
  projectCategories: any[];
  tasks?: any[];
  onAddTask?: (categoryPreselection?: { tier1Category: string, tier2Category: string }) => void;
}

export function CategoryManager({ projectId, projectCategories, tasks, onAddTask }: CategoryManagerProps) {
  const { theme: currentTheme } = useProjectTheme(projectId);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"tier1" | "tier2">("tier1");
  const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [editCategoryParentId, setEditCategoryParentId] = useState<number | null>(null);
  const [addingSubcategoryFor, setAddingSubcategoryFor] = useState<number | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryDescription, setNewSubcategoryDescription] = useState("");
  
  // Duplicate category state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [categoryToDuplicate, setCategoryToDuplicate] = useState<any>(null);
  const [duplicateCategoryName, setDuplicateCategoryName] = useState("");
  
  // Track expanded descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  
  // Toggle description expansion
  const toggleDescription = (categoryId: number) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };
  
  // Truncate description for preview (show first 50 chars)
  const getDescriptionPreview = (description: string, maxLength: number = 50) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + "...";
  };

  // Get theme colors for categories
  const getMainCategoryColor = (index: number) => {
    if (!currentTheme) return FALLBACK_COLORS.primary;
    const mainColors = [
      currentTheme.primary,
      currentTheme.secondary,
      currentTheme.accent,
      currentTheme.muted
    ];
    if (index < 4) {
      return mainColors[index];
    } else if (currentTheme.subcategories && currentTheme.subcategories.length > 0) {
      return currentTheme.subcategories[(index - 4) % currentTheme.subcategories.length];
    } else {
      return mainColors[index % 4];
    }
  };

  // Handle custom category creation
  const handleCreateCustomCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Category name is required");
      return;
    }

    if (newCategoryType === "tier2" && !selectedParentCategory) {
      alert("Parent category is required for tier2 categories");
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          type: newCategoryType,
          description: newCategoryDescription.trim() || null,
          parentId: newCategoryType === "tier2" ? selectedParentCategory : null,
          sortOrder: 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      // Reset form
      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewCategoryType("tier1");
      setSelectedParentCategory(null);
      setShowCreateCategory(false);

      // Refresh categories using unified API
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories/flat`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories`] });
      // Also invalidate legacy endpoint for backward compatibility
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "template-categories"] });

      alert('Category created successfully!');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  // Handle edit category
  const handleEditCategory = (category: any) => {
    setEditingCategory(category.id);
    setEditCategoryName(category.name);
    setEditCategoryDescription(category.description || "");
    setEditCategoryParentId(category.parentId || null);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editCategoryName.trim()) {
      alert("Category name is required");
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/categories/${editingCategory}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCategoryName.trim(),
          description: editCategoryDescription.trim() || null,
          parentId: editCategoryParentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      // Reset edit state
      setEditingCategory(null);
      setEditCategoryName("");
      setEditCategoryDescription("");

      // Refresh categories and tasks (since tasks display category names)
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories/flat`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories`] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
      // Also invalidate legacy endpoint for backward compatibility
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "template-categories"] });

      alert('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      // Refresh categories
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories/flat`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories`] });
      // Also invalidate legacy endpoint for backward compatibility
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "template-categories"] });

      alert('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditCategoryName("");
    setEditCategoryDescription("");
    setEditCategoryParentId(null);
  };

  // Handle duplicate category - open dialog
  const handleDuplicateCategory = (category: any) => {
    setCategoryToDuplicate(category);
    setDuplicateCategoryName(`${category.name} (Copy)`);
    setShowDuplicateDialog(true);
  };

  // Handle confirm duplicate - perform the duplication
  const handleConfirmDuplicate = async () => {
    if (!duplicateCategoryName.trim()) {
      alert("New category name is required");
      return;
    }

    if (!categoryToDuplicate) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/template-categories/${categoryToDuplicate.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newName: duplicateCategoryName.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to duplicate category');
      }

      const result = await response.json();

      // Close dialog and reset state
      setShowDuplicateDialog(false);
      setCategoryToDuplicate(null);
      setDuplicateCategoryName("");

      // Refresh categories and tasks
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories/flat`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories`] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "template-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });

      alert(result.message || 'Category duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating category:', error);
      alert(error instanceof Error ? error.message : 'Failed to duplicate category');
    }
  };

  // Handle add subcategory
  const handleAddSubcategory = async (parentId: number) => {
    if (!newSubcategoryName.trim()) {
      alert("Subcategory name is required");
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubcategoryName.trim(),
          type: 'tier2',
          description: newSubcategoryDescription.trim() || null,
          parentId: parentId,
          sortOrder: 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create subcategory');
      }

      // Reset form
      setNewSubcategoryName("");
      setNewSubcategoryDescription("");
      setAddingSubcategoryFor(null);

      // Refresh categories using unified API
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories/flat`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories`] });
      // Also invalidate legacy endpoint for backward compatibility
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "template-categories"] });

      alert('Subcategory created successfully!');
    } catch (error) {
      console.error('Error creating subcategory:', error);
      alert('Failed to create subcategory');
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (result: any) => {
    const { destination, source } = result;

    if (!destination || destination.index === source.index) {
      return;
    }

    try {
      // Get the current categories in their current order
      const tier1Categories = projectCategories?.filter((cat: any) => cat.type === "tier1")
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)) || [];

      // Reorder the categories array
      const reorderedCategories = Array.from(tier1Categories);
      const [movedCategory] = reorderedCategories.splice(source.index, 1);
      reorderedCategories.splice(destination.index, 0, movedCategory);

      // Create the new order payload
      const categoryOrders = reorderedCategories.map((category: any, index: number) => ({
        id: category.id,
        sortOrder: index
      }));

      // Make API call to reorder categories using unified API
      const response = await fetch(`/api/projects/${projectId}/categories/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryOrders })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder categories');
      }

      // Refresh categories to show the new order
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories/flat`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories`] });
      // Also invalidate legacy endpoint for backward compatibility
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "template-categories"] });

    } catch (error) {
      console.error('Error reordering categories:', error);
      alert('Failed to reorder categories');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Categories</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateCategory(!showCreateCategory)}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>

      {showCreateCategory && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Custom Phase"
              />
            </div>
            <div>
              <Label htmlFor="category-type">Category Type</Label>
              <Select value={newCategoryType} onValueChange={(value: "tier1" | "tier2") => setNewCategoryType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier1">Main Category (Tier 1)</SelectItem>
                  <SelectItem value="tier2">Sub Category (Tier 2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {newCategoryType === "tier2" && (
            <div>
              <Label htmlFor="parent-category">Parent Category</Label>
              <Select value={selectedParentCategory?.toString() || ""} onValueChange={(value) => setSelectedParentCategory(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category..." />
                </SelectTrigger>
                <SelectContent>
                  {projectCategories?.filter((cat: any) => cat.type === "tier1").map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="category-description">Description (Optional)</Label>
            <Textarea
              id="category-description"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              placeholder="Describe what this category is for..."
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreateCustomCategory}>
              <Tags className="h-4 w-4 mr-2" /> Create Category
            </Button>
            <Button variant="outline" onClick={() => setShowCreateCategory(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {projectCategories && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Current Categories (Drag to reorder)
          </h4>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div className="space-y-4" {...provided.droppableProps} ref={provided.innerRef}>
                  {projectCategories
                    .filter((cat: any) => cat.type === "tier1")
                    .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map((mainCategory: any, index: number) => {
                      const subCategories = projectCategories.filter((cat: any) =>
                        cat.type === "tier2" && cat.parentId === mainCategory.id
                      );
                      const mainColor = getMainCategoryColor(index);

                      return (
                        <Draggable
                          key={mainCategory.id}
                          draggableId={mainCategory.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="border rounded-lg p-3 bg-slate-50"
                            >
                              {/* Main Category */}
                              <div className="rounded p-2 mb-2" style={{ backgroundColor: `${mainColor}15` }}>
                                {editingCategory === mainCategory.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={editCategoryName}
                                      onChange={(e) => setEditCategoryName(e.target.value)}
                                      className="text-sm"
                                    />
                                    <Textarea
                                      value={editCategoryDescription}
                                      onChange={(e) => setEditCategoryDescription(e.target.value)}
                                      placeholder="Description (optional)"
                                      rows={1}
                                      className="text-sm"
                                    />
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <div {...provided.dragHandleProps}>
                                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                        </div>
                                        <Tags className="h-4 w-4 flex-shrink-0" style={{ color: mainColor }} />
                                        <span className="font-semibold text-base truncate">{mainCategory.name}</span>
                                      </div>
                                      {mainCategory.description && (
                                        <div className="mt-1 ml-10">
                                          <button
                                            onClick={() => toggleDescription(mainCategory.id)}
                                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                                          >
                                            <ChevronDown 
                                              className={`h-3 w-3 transition-transform ${expandedDescriptions.has(mainCategory.id) ? 'rotate-180' : ''}`} 
                                            />
                                            <span className="text-left">
                                              {expandedDescriptions.has(mainCategory.id) 
                                                ? mainCategory.description 
                                                : getDescriptionPreview(mainCategory.description)}
                                            </span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0"
                                        >
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditCategory(mainCategory)}>
                                          <Edit2 className="h-3 w-3 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicateCategory(mainCategory)}>
                                          <Copy className="h-3 w-3 mr-2" />
                                          Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteCategory(mainCategory.id, mainCategory.name)}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <Trash2 className="h-3 w-3 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                              </div>

                              {/* Sub Categories */}
                              {subCategories.length > 0 && (
                                <div className="ml-4 space-y-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Subcategories:</p>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setAddingSubcategoryFor(mainCategory.id)}
                                      className="h-6 text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" /> Add Subcategory
                                    </Button>
                                  </div>
                                  {subCategories.map((subCategory: any) => (
                                    <div key={subCategory.id} className="rounded p-2" style={{ backgroundColor: `${mainColor}10` }}>
                                      {editingCategory === subCategory.id ? (
                                        <div className="space-y-2">
                                          <Input
                                            value={editCategoryName}
                                            onChange={(e) => setEditCategoryName(e.target.value)}
                                            className="text-sm"
                                          />
                                          <Textarea
                                            value={editCategoryDescription}
                                            onChange={(e) => setEditCategoryDescription(e.target.value)}
                                            placeholder="Description (optional)"
                                            rows={1}
                                            className="text-sm"
                                          />
                                          <div className="flex gap-1">
                                            <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                                              <Save className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <Tags className="h-3 w-3 ml-2 flex-shrink-0" style={{ color: mainColor }} />
                                                <span className="font-medium text-sm truncate">{subCategory.name}</span>
                                              </div>
                                              {subCategory.description && (
                                                <div className="mt-0.5 ml-7">
                                                  <button
                                                    onClick={() => toggleDescription(subCategory.id)}
                                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                                                  >
                                                    <ChevronDown 
                                                      className={`h-2.5 w-2.5 transition-transform ${expandedDescriptions.has(subCategory.id) ? 'rotate-180' : ''}`} 
                                                    />
                                                    <span className="text-left">
                                                      {expandedDescriptions.has(subCategory.id) 
                                                        ? subCategory.description 
                                                        : getDescriptionPreview(subCategory.description, 40)}
                                                    </span>
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-6 w-6 p-0"
                                                >
                                                  <MoreVertical className="h-3 w-3" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                {onAddTask && (
                                                  <DropdownMenuItem
                                                    onClick={() => onAddTask({ tier1Category: mainCategory.name, tier2Category: subCategory.name })}
                                                  >
                                                    <FileText className="h-3 w-3 mr-2" />
                                                    Add Task
                                                  </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleEditCategory(subCategory)}>
                                                  <Edit2 className="h-3 w-3 mr-2" />
                                                  Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  onClick={() => handleDeleteCategory(subCategory.id, subCategory.name)}
                                                  className="text-red-600 focus:text-red-600"
                                                >
                                                  <Trash2 className="h-3 w-3 mr-2" />
                                                  Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                          {/* Show tasks for this subcategory */}
                                          {tasks && (() => {
                                            const subCategoryTasks = tasks.filter((task: any) =>
                                              task.tier1Category?.toLowerCase() === mainCategory.name.toLowerCase() &&
                                              task.tier2Category?.toLowerCase() === subCategory.name.toLowerCase()
                                            );

                                            if (subCategoryTasks.length > 0) {
                                              return (
                                                <div className="mt-2 ml-5 space-y-1">
                                                  <p className="text-xs text-muted-foreground font-medium">Tasks ({subCategoryTasks.length}):</p>
                                                  <div className="space-y-1">
                                                    {subCategoryTasks.map((task: any) => (
                                                      <div key={task.id} className="text-xs bg-white rounded px-2 py-1.5 border hover:border-gray-300 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                          <ListTodo className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                                          <span className="flex-1 font-medium truncate">{task.title}</span>
                                                          <StatusBadge status={task.status} />
                                                          <div className="flex gap-1 ml-2 flex-shrink-0">
                                                            <Button
                                                              size="sm"
                                                              variant="ghost"
                                                              onClick={() => {
                                                                window.location.href = `/tasks/${task.id}`;
                                                              }}
                                                              className="h-5 w-5 p-0"
                                                              title="Edit task"
                                                            >
                                                              <Edit2 className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                              size="sm"
                                                              variant="ghost"
                                                              onClick={async () => {
                                                                if (confirm(`Are you sure you want to delete the task "${task.title}"?`)) {
                                                                  try {
                                                                    const response = await fetch(`/api/tasks/${task.id}`, {
                                                                      method: 'DELETE'
                                                                    });
                                                                    if (response.ok) {
                                                                      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
                                                                      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/categories/flat`] });
                                                                      alert('Task deleted successfully');
                                                                    } else {
                                                                      alert('Failed to delete task');
                                                                    }
                                                                  } catch (error) {
                                                                    console.error('Error deleting task:', error);
                                                                    alert('Failed to delete task');
                                                                  }
                                                                }
                                                              }}
                                                              className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                                                              title="Delete task"
                                                            >
                                                              <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                          </div>
                                                        </div>
                                                        {task.description && (
                                                          <div className="mt-1 ml-5">
                                                            <button
                                                              onClick={() => toggleDescription(-task.id)}
                                                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                            >
                                                              <ChevronDown 
                                                                className={`h-2.5 w-2.5 transition-transform ${expandedDescriptions.has(-task.id) ? 'rotate-180' : ''}`} 
                                                              />
                                                              <span className="text-left">
                                                                {expandedDescriptions.has(-task.id) 
                                                                  ? task.description 
                                                                  : getDescriptionPreview(task.description, 35)}
                                                              </span>
                                                            </button>
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              );
                                            }
                                            return null;
                                          })()}
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add Subcategory Section */}
                              {addingSubcategoryFor === mainCategory.id ? (
                                <div className="ml-4 mt-2 bg-gray-50 p-3 rounded space-y-3">
                                  <div>
                                    <Label htmlFor={`subcat-name-${mainCategory.id}`}>Subcategory Name</Label>
                                    <Input
                                      id={`subcat-name-${mainCategory.id}`}
                                      value={newSubcategoryName}
                                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                                      placeholder="e.g., Planning"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`subcat-desc-${mainCategory.id}`}>Description (Optional)</Label>
                                    <Textarea
                                      id={`subcat-desc-${mainCategory.id}`}
                                      value={newSubcategoryDescription}
                                      onChange={(e) => setNewSubcategoryDescription(e.target.value)}
                                      placeholder="Describe this subcategory..."
                                      rows={2}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddSubcategory(mainCategory.id)}
                                      className="text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" /> Add
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setAddingSubcategoryFor(null);
                                        setNewSubcategoryName("");
                                        setNewSubcategoryDescription("");
                                      }}
                                      className="text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="ml-4 mt-2">
                                  {subCategories.length === 0 ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground italic">No subcategories yet</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setAddingSubcategoryFor(mainCategory.id)}
                                        className="h-6 text-xs"
                                      >
                                        <Plus className="h-3 w-3 mr-1" /> Add Subcategory
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setAddingSubcategoryFor(mainCategory.id)}
                                      className="h-6 text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" /> Add Another Subcategory
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Show orphaned subcategories (subcategories without a parent) */}
          {(() => {
            const orphanedSubs = projectCategories.filter((cat: any) =>
              cat.type === "tier2" &&
              !projectCategories.some((parent: any) => parent.type === "tier1" && parent.id === cat.parentId)
            );

            if (orphanedSubs.length > 0) {
              return (
                <div className="border rounded-lg p-3 bg-yellow-50 mt-4">
                  <p className="text-sm font-medium mb-2 text-yellow-800">Orphaned Subcategories</p>
                  <div className="space-y-1">
                    {orphanedSubs.map((category: any) => (
                      <div key={category.id} className="bg-yellow-100 rounded p-2">
                        {editingCategory === category.id ? (
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor="edit-category-name">Category Name</Label>
                              <Input
                                id="edit-category-name"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-category-description">Description (Optional)</Label>
                              <Textarea
                                id="edit-category-description"
                                value={editCategoryDescription}
                                onChange={(e) => setEditCategoryDescription(e.target.value)}
                                placeholder="Description (optional)"
                                rows={1}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-parent-category">Assign to Parent Category</Label>
                              <Select
                                value={editCategoryParentId?.toString() || ""}
                                onValueChange={(value) => setEditCategoryParentId(value ? parseInt(value) : null)}
                              >
                                <SelectTrigger id="edit-parent-category">
                                  <SelectValue placeholder="Select parent category..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">No parent (orphaned)</SelectItem>
                                  {projectCategories?.filter((cat: any) => cat.type === "tier1").map((cat: any) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                                <Save className="h-3 w-3 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="h-3 w-3 mr-1" /> Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Tags className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                                <span className="font-medium text-sm truncate">{category.name}</span>
                                <span className="text-xs text-yellow-600 flex-shrink-0">(No parent)</span>
                              </div>
                              {category.description && (
                                <div className="mt-0.5 ml-5">
                                  <button
                                    onClick={() => toggleDescription(category.id)}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                                  >
                                    <ChevronDown 
                                      className={`h-2.5 w-2.5 transition-transform ${expandedDescriptions.has(category.id) ? 'rotate-180' : ''}`} 
                                    />
                                    <span className="text-left">
                                      {expandedDescriptions.has(category.id) 
                                        ? category.description 
                                        : getDescriptionPreview(category.description, 40)}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditCategory(category)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteCategory(category.id, category.name)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* Duplicate Category Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This will duplicate "{categoryToDuplicate?.name}" along with all its subcategories and tasks.
            </p>
            <div>
              <Label htmlFor="duplicate-name">New Category Name</Label>
              <Input
                id="duplicate-name"
                value={duplicateCategoryName}
                onChange={(e) => setDuplicateCategoryName(e.target.value)}
                placeholder="Enter new category name"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDuplicateDialog(false);
                  setCategoryToDuplicate(null);
                  setDuplicateCategoryName("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
