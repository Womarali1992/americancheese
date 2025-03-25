import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, ChevronRight, Calendar, User, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getStatusBorderColor, getStatusBgColor, formatTaskStatus } from "@/lib/color-utils";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getCategoryColor } from "@/lib/color-utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Task } from "@/../../shared/schema";
import { Material } from "@/types";
import { CreateMaterialDialog } from "@/pages/materials/CreateMaterialDialog";
import { EditMaterialDialog } from "@/pages/materials/EditMaterialDialog";

export function TaskMaterialsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [isCreateMaterialOpen, setIsCreateMaterialOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  
  // Fetch tasks and materials
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });
  
  // Filter tasks based on search term
  const filteredTasks = tasks.filter(task => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(searchTermLower) ||
      (task.description && task.description.toLowerCase().includes(searchTermLower)) ||
      task.status.toLowerCase().includes(searchTermLower) ||
      (task.assignedTo && task.assignedTo.toLowerCase().includes(searchTermLower)) ||
      (task.category && task.category.toLowerCase().includes(searchTermLower))
    );
  });
  
  // Toggle task expansion
  const toggleTaskExpansion = (taskId: number) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };
  
  // Get materials for a specific task
  const getMaterialsForTask = (taskId: number): Material[] => {
    // Convert task.materialIds to numbers for consistency
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.materialIds) return [];
    
    const materialIds = Array.isArray(task.materialIds)
      ? task.materialIds.map(id => typeof id === 'string' ? parseInt(id) : id)
      : [];
      
    return materials.filter(material => materialIds.includes(material.id));
  };
  
  // Open create material dialog for a specific task
  const handleAddMaterial = (taskId: number) => {
    setSelectedTaskId(taskId);
    setIsCreateMaterialOpen(true);
  };
  
  // Edit a material
  const handleEditMaterial = (material: Material) => {
    setMaterialToEdit(material);
  };
  
  return (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-orange-500">Materials by Task</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Task Cards with Collapsible Material Lists */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <Collapsible
              key={task.id}
              open={expandedTaskId === task.id}
              onOpenChange={() => toggleTaskExpansion(task.id)}
              className="border rounded-lg overflow-hidden"
            >
              <div className={`border-l-4 ${getStatusBorderColor(task.status)}`}>
                <CollapsibleTrigger className="w-full text-left">
                  <div className="p-4 flex flex-wrap justify-between items-start gap-2 hover:bg-slate-50">
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBgColor(task.status)}`}>
                          {formatTaskStatus(task.status)}
                        </span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span>{formatDate(task.startDate)} - {formatDate(task.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-orange-500" />
                          <span>{task.assignedTo || "Unassigned"}</span>
                        </div>
                      </div>
                      
                      {task.category && (
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(task.category)}`}>
                            {task.category.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium flex items-center text-orange-800">
                        <Package className="h-3 w-3 mr-1" />
                        {getMaterialsForTask(task.id).length} materials
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400 transform transition-transform duration-200" 
                        style={{ transform: expandedTaskId === task.id ? 'rotate(90deg)' : 'rotate(0)' }} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t p-4 bg-slate-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-orange-700 flex items-center">
                        <Package className="h-4 w-4 mr-1" /> 
                        Materials for this Task
                      </h4>
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={() => handleAddMaterial(task.id)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Material
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getMaterialsForTask(task.id).length > 0 ? (
                        getMaterialsForTask(task.id).map(material => (
                          <Card key={material.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="p-3 pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-base font-medium">{material.name}</CardTitle>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  material.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                                  material.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                                  material.status === 'used' ? 'bg-purple-100 text-purple-800' :
                                  'bg-slate-100 text-slate-800'
                                }`}>
                                  {material.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                              <div className="text-sm text-slate-600">
                                <div className="flex justify-between items-center mt-1">
                                  <span className="font-medium">{material.quantity} {material.unit || 'pcs'}</span>
                                  {material.cost && (
                                    <span className="font-medium">
                                      {formatCurrency(material.cost * material.quantity)}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1">{material.type}</div>
                                {material.supplier && (
                                  <div className="mt-1 text-xs text-slate-500">
                                    Supplier: {material.supplier}
                                  </div>
                                )}
                              </div>
                              <div className="mt-2 pt-2 border-t flex justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-orange-500 hover:text-orange-600 h-8 px-2"
                                  onClick={() => handleEditMaterial(material)}
                                >
                                  Edit
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-8 bg-white rounded-lg border">
                          <Package className="mx-auto h-8 w-8 text-slate-300" />
                          <p className="mt-2 text-slate-500">No materials associated with this task</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 text-orange-500 border-orange-300 hover:bg-orange-50"
                            onClick={() => handleAddMaterial(task.id)}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Material
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-lg border">
            <Package className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 font-medium">No Tasks Found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
      
      {/* Create Material Dialog */}
      <CreateMaterialDialog
        open={isCreateMaterialOpen}
        onOpenChange={setIsCreateMaterialOpen}
        projectId={tasks.find(t => t.id === selectedTaskId)?.projectId}
      />
      
      {/* Edit Material Dialog */}
      {materialToEdit && (
        <EditMaterialDialog
          open={!!materialToEdit}
          onOpenChange={(open) => {
            if (!open) setMaterialToEdit(null);
          }}
          material={materialToEdit}
        />
      )}
    </div>
  );
}