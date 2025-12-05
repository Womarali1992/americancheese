import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FALLBACK_COLORS } from '@/lib/unified-color-system';

interface ProjectCategory {
  id: number;
  projectId: number;
  name: string;
  type: 'tier1' | 'tier2';
  parentId?: number | null;
  color?: string | null;
  description?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectCategoryEditorProps {
  projectId: number;
  projectName: string;
}

export default function ProjectCategoryEditor({ projectId, projectName }: ProjectCategoryEditorProps) {
  const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'tier1' as 'tier1' | 'tier2',
    parentId: null as number | null,
    color: FALLBACK_COLORS.primary,
    description: '',
    sortOrder: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch project categories
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['project-categories', projectId],
    queryFn: async () => {
      const response = await apiRequest(`/api/projects/${projectId}/categories`, 'GET');
      return await response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: (category: Partial<ProjectCategory> & { id: number }) =>
      apiRequest(`/api/projects/${projectId}/categories/${category.id}`, 'PUT', category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-categories', projectId] });
      setEditingCategory(null);
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (category: Omit<ProjectCategory, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) =>
      apiRequest(`/api/projects/${projectId}/categories`, 'POST', category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-categories', projectId] });
      setNewCategory({
        name: '',
        type: 'tier1',
        parentId: null,
        color: FALLBACK_COLORS.primary,
        description: '',
        sortOrder: 0
      });
      setShowAddForm(false);
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: number) =>
      apiRequest(`/api/projects/${projectId}/categories/${categoryId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-categories', projectId] });
    },
  });

  // Get tier1 categories for parent selection
  const tier1Categories = categories?.filter((cat: ProjectCategory) => cat.type === 'tier1') || [];

  const handleEdit = (category: ProjectCategory) => {
    setEditingCategory(category);
  };

  const handleSave = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate(editingCategory);
    }
  };

  const handleAdd = () => {
    if (newCategory.name.trim()) {
      createCategoryMutation.mutate({
        ...newCategory,
        sortOrder: newCategory.sortOrder || 0
      });
    }
  };

  const handleDelete = (categoryId: number) => {
    if (confirm('Are you sure you want to delete this category? This will affect all tasks using this category.')) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  if (isLoading) return <div className="p-4">Loading categories...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading categories: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Category Management for {projectName}</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showAddForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">Add New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="Category name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={newCategory.type}
                onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as 'tier1' | 'tier2' })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="tier1">Tier 1 (Main Category)</option>
                <option value="tier2">Tier 2 (Subcategory)</option>
              </select>
            </div>
            {newCategory.type === 'tier2' && (
              <div>
                <label className="block text-sm font-medium mb-1">Parent Category</label>
                <select
                  value={newCategory.parentId || ''}
                  onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select parent category</option>
                  {tier1Categories.map((cat: ProjectCategory) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="w-full p-2 border rounded-lg"
                rows={2}
                placeholder="Category description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort Order</label>
              <input
                type="number"
                value={newCategory.sortOrder}
                onChange={(e) => setNewCategory({ ...newCategory, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded-lg"
                min="0"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newCategory.name.trim() || (newCategory.type === 'tier2' && !newCategory.parentId)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Add Category
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        {/* Tier 1 Categories */}
        <div>
          <h3 className="text-lg font-medium mb-3">Main Categories (Tier 1)</h3>
          <div className="space-y-2">
            {categories
              ?.filter((cat: ProjectCategory) => cat.type === 'tier1')
              .sort((a: ProjectCategory, b: ProjectCategory) => a.sortOrder - b.sortOrder)
              .map((category: ProjectCategory) => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color || FALLBACK_COLORS.primary }}
                    />
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-gray-600">{category.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Tier 2 Categories */}
        <div>
          <h3 className="text-lg font-medium mb-3">Subcategories (Tier 2)</h3>
          <div className="space-y-2">
            {categories
              ?.filter((cat: ProjectCategory) => cat.type === 'tier2')
              .sort((a: ProjectCategory, b: ProjectCategory) => a.sortOrder - b.sortOrder)
              .map((category: ProjectCategory) => {
                const parent = categories.find((cat: ProjectCategory) => cat.id === category.parentId);
                return (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.color || FALLBACK_COLORS.primary }}
                      />
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-gray-500">Parent: {parent?.name || 'Unknown'}</div>
                        {category.description && (
                          <div className="text-sm text-gray-600">{category.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Edit Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input
                  type="color"
                  value={editingCategory.color || FALLBACK_COLORS.primary}
                  onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <input
                  type="number"
                  value={editingCategory.sortOrder}
                  onChange={(e) => setEditingCategory({ ...editingCategory, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded-lg"
                  min="0"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
