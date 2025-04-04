import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Package, 
  Building, 
  Phone, 
  Mail, 
  Search,
  Plus,
  Link,
  ExternalLink,
  FileText,
  Upload,
  Download,
  Edit,
  PenSquare,
  Trash,
  AlertTriangle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImportQuotesDialog } from "./ImportQuotesDialog";

import { EditContactDialog } from './EditContactDialog';

// This component displays a single supplier card
interface SupplierCardProps {
  supplier: {
    id: number;
    name: string;
    company?: string;
    phone?: string;
    email?: string;
    type: string;
    category: string;
    initials?: string;
  };
  onViewQuotes: (supplierId: number) => void;
}

export function SupplierCard({ supplier, onViewQuotes }: SupplierCardProps) {
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  
  const handleEditClick = () => {
    setIsEditContactOpen(true);
  };
  
  return (
    <>
      <Card className="bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-medium">
              {supplier.initials || supplier.name.charAt(0)}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium">{supplier.name}</h3>
              <p className="text-sm text-slate-500">{supplier.company || "Supplier"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-700"
              onClick={handleEditClick}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {supplier.category || "Building Materials"}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 text-sm">
            {supplier.phone && (
              <div className="flex items-center">
                <Phone className="text-slate-400 w-5 h-4 mr-1" />
                <span>{supplier.phone}</span>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center">
                <Mail className="text-slate-400 w-5 h-4 mr-1" />
                <span>{supplier.email}</span>
              </div>
            )}
            {supplier.company && (
              <div className="flex items-center">
                <Building className="text-slate-400 w-5 h-4 mr-1" />
                <span>{supplier.company}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button 
              variant="outline"
              className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              onClick={() => onViewQuotes(supplier.id)}
            >
              <FileText className="mr-1 h-4 w-4" /> View Quotes
            </Button>
            <Button 
              variant="outline"
              className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Phone className="mr-1 h-4 w-4" /> Contact
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Contact Dialog */}
      <EditContactDialog
        open={isEditContactOpen}
        onOpenChange={setIsEditContactOpen}
        contactId={supplier.id}
      />
    </>
  );
}

// This component displays a list of material quotes from a supplier
interface SupplierQuotesProps {
  supplierId: number;
  onClose: () => void;
}

function SupplierQuotes({ supplierId, onClose }: SupplierQuotesProps) {
  const [activeTab, setActiveTab] = useState<"quotes" | "orders">("quotes");
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [isEditQuoteOpen, setIsEditQuoteOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Fetch quotes (materials with isQuote=true)
  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ["/api/materials", { isQuote: true, supplierId }],
  });
  
  // Fetch orders (materials with isQuote=false)
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/materials", { isQuote: false, supplierId }],
  });
  
  // Get supplier details
  const { data: supplier } = useQuery({
    queryKey: ["/api/contacts", supplierId],
  });

  const convertQuoteToOrder = async (quoteId: number) => {
    try {
      await apiRequest(`/api/materials/${quoteId}`, 'PUT', {
        isQuote: false, 
        orderDate: new Date().toISOString().split('T')[0],
        status: 'ordered'
      });
      
      // Invalidate both queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      
      toast({
        title: "Success",
        description: "Quote converted to order successfully",
      });
    } catch (error) {
      console.error("Failed to convert quote to order:", error);
      toast({
        title: "Error",
        description: "Failed to convert quote to order",
        variant: "destructive",
      });
    }
  };
  
  const handleEditSupplier = () => {
    setIsEditContactOpen(true);
  };
  
  const handleEditQuote = (quote: any) => {
    setSelectedQuote(quote);
    setIsEditQuoteOpen(true);
  };
  
  const handleDeleteQuote = (quoteId: number) => {
    setQuoteToDelete(quoteId);
    setIsDeleteConfirmOpen(true);
  };
  
  const confirmDeleteQuote = async () => {
    if (!quoteToDelete) return;
    
    try {
      await apiRequest(`/api/materials/${quoteToDelete}`, 'DELETE');
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      
      toast({
        title: "Success",
        description: "Quote deleted successfully",
      });
      
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Failed to delete quote:", error);
      toast({
        title: "Error",
        description: "Failed to delete quote",
        variant: "destructive",
      });
    }
  };

  // Create EditQuoteDialog component for editing quotes/orders
  const EditQuoteDialog = () => {
    const [formData, setFormData] = useState(selectedQuote ? {
      name: selectedQuote.name || "",
      type: selectedQuote.type || "Lumber", 
      category: selectedQuote.category || "Wood",
      quantity: selectedQuote.quantity || 1,
      unit: selectedQuote.unit || "pieces",
      cost: selectedQuote.cost || 0,
      quoteDate: selectedQuote.quoteDate || new Date().toISOString().split('T')[0],
      orderDate: selectedQuote.orderDate || "",
      status: selectedQuote.status || (selectedQuote?.isQuote ? "quote" : "ordered"),
    } : {
      name: "",
      type: "Lumber",
      category: "Wood",
      quantity: 1,
      unit: "pieces",
      cost: 0,
      quoteDate: new Date().toISOString().split('T')[0],
      orderDate: "",
      status: "quote"
    });
    
    // Get all projects to select one
    const { data: projects } = useQuery({
      queryKey: ["/api/projects"],
    });
    
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
      selectedQuote?.projectId || null
    );
    
    const updateQuote = async () => {
      if (!selectedQuote || !selectedProjectId) return;
      
      try {
        const finalData = {
          ...formData,
          projectId: selectedProjectId,
          isQuote: selectedQuote.isQuote // Preserve quote/order status
        };
        
        await apiRequest(`/api/materials/${selectedQuote.id}`, "PUT", finalData);
        
        toast({
          title: "Success",
          description: `${selectedQuote.isQuote ? "Quote" : "Order"} updated successfully`,
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
        setIsEditQuoteOpen(false);
      } catch (error) {
        console.error("Failed to update quote:", error);
        toast({
          title: "Error",
          description: `Failed to update ${selectedQuote.isQuote ? "quote" : "order"}`,
          variant: "destructive",
        });
      }
    };
    
    return (
      <Dialog open={isEditQuoteOpen} onOpenChange={setIsEditQuoteOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit {selectedQuote?.isQuote ? "Quote" : "Order"}</DialogTitle>
            <DialogDescription>
              Update the details for this {selectedQuote?.isQuote ? "quote" : "order"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Material Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Input 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input 
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <Input 
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost Per Unit</label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{selectedQuote?.isQuote ? "Quote" : "Order"} Date</label>
                <Input 
                  type="date"
                  value={selectedQuote?.isQuote ? formData.quoteDate : formData.orderDate}
                  onChange={(e) => {
                    if (selectedQuote?.isQuote) {
                      setFormData({...formData, quoteDate: e.target.value});
                    } else {
                      setFormData({...formData, orderDate: e.target.value});
                    }
                  }}
                />
              </div>
            </div>
            
            {!selectedQuote?.isQuote && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="ordered">Ordered</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedProjectId || ""}
                onChange={(e) => setSelectedProjectId(parseInt(e.target.value) || null)}
              >
                <option value="">Select a project</option>
                {projects?.map((project: any) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditQuoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateQuote}>
              Update {selectedQuote?.isQuote ? "Quote" : "Order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Create DeleteConfirmationDialog component
  const DeleteConfirmationDialog = () => {
    return (
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center py-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteQuote}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">
            {supplier?.name || "Supplier"} Materials
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage quotes and orders from this supplier
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEditSupplier}
            className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
          >
            <Edit className="h-4 w-4 mr-1" /> Edit Supplier
          </Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
      
      {/* Edit Contact Dialog */}
      <EditContactDialog
        open={isEditContactOpen}
        onOpenChange={setIsEditContactOpen}
        contactId={supplierId}
      />
      
      {/* Edit Quote Dialog */}
      {isEditQuoteOpen && <EditQuoteDialog />}
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog />
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="quotes" className="relative">
            Quotes
            {quotes?.length > 0 && (
              <Badge className="ml-1 bg-green-100 text-green-800 absolute -top-2 -right-2">
                {quotes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="relative">
            Orders
            {orders?.length > 0 && (
              <Badge className="ml-1 bg-blue-100 text-blue-800 absolute -top-2 -right-2">
                {orders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="quotes" className="space-y-4">
          {quotesLoading ? (
            <div className="text-center py-8">Loading quotes...</div>
          ) : quotes?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No quotes from this supplier
            </div>
          ) : (
            <div className="space-y-3">
              {quotes?.map((quote: any) => (
                <Card key={quote.id}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-md">{quote.name}</CardTitle>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Quote
                      </Badge>
                    </div>
                    <CardDescription>
                      {quote.type} - {quote.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p>{quote.quantity} {quote.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost Per Unit</p>
                        <p>${(quote.cost || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Cost</p>
                        <p className="font-semibold">${((quote.quantity || 0) * (quote.cost || 0)).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quote Date</p>
                        <p>{quote.quoteDate || "Not specified"}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                      onClick={() => handleEditQuote(quote)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-red-50 text-red-700 hover:bg-red-100"
                      onClick={() => handleDeleteQuote(quote.id)}
                    >
                      <Trash className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => convertQuoteToOrder(quote.id)}
                    >
                      Convert to Order
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="orders" className="space-y-4">
          {ordersLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : orders?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders from this supplier
            </div>
          ) : (
            <div className="space-y-3">
              {orders?.map((order: any) => (
                <Card key={order.id}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-md">{order.name}</CardTitle>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {order.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {order.type} - {order.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p>{order.quantity} {order.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost Per Unit</p>
                        <p>${(order.cost || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Cost</p>
                        <p className="font-semibold">${((order.quantity || 0) * (order.cost || 0)).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Order Date</p>
                        <p>{order.orderDate || "Not specified"}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                      onClick={() => handleEditQuote(order)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-red-50 text-red-700 hover:bg-red-100"
                      onClick={() => handleDeleteQuote(order.id)}
                    >
                      <Trash className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CreateQuoteDialogProps {
  supplierId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateQuoteDialog({ supplierId, open, onOpenChange }: CreateQuoteDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "Lumber",
    category: "Wood",
    quantity: 1,
    unit: "pieces", 
    cost: 0,
    isQuote: true,
    supplierId,
    quoteDate: new Date().toISOString().split('T')[0],
  });
  
  const { toast } = useToast();
  
  // Get all projects to select one
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  const createQuote = async () => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const finalData = {
        ...formData,
        projectId: selectedProjectId,
      };
      
      await apiRequest("/api/materials", "POST", finalData);
      
      toast({
        title: "Success",
        description: "Quote created successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create quote:", error);
      toast({
        title: "Error",
        description: "Failed to create quote",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Quote</DialogTitle>
          <DialogDescription>
            Add a new material quote from this supplier
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Material Name</label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="2x4 Lumber"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Input 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                placeholder="Lumber"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Wood"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input 
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit</label>
              <Input 
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                placeholder="pieces"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cost Per Unit</label>
              <Input 
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quote Date</label>
              <Input 
                type="date"
                value={formData.quoteDate}
                onChange={(e) => setFormData({...formData, quoteDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Project</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(parseInt(e.target.value) || null)}
            >
              <option value="">Select a project</option>
              {projects?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={createQuote}>
            Create Quote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Suppliers View component
export function SuppliersView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Fetch suppliers (contacts with type="supplier")
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["/api/contacts"],
  });
  
  // Filter to get only suppliers
  const suppliers = contacts?.filter(contact => contact.type === "supplier") || [];
  
  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.company && supplier.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Handle view quotes button click
  const handleViewQuotes = (supplierId: number) => {
    setSelectedSupplierId(supplierId);
  };
  
  // Handle adding a new quote for a supplier
  const handleAddQuote = (supplierId: number) => {
    setSelectedSupplierId(supplierId);
    setIsQuoteDialogOpen(true);
  };
  
  // Handle importing quotes from CSV
  const handleImportQuotes = (supplierId: number) => {
    setSelectedSupplierId(supplierId);
    setIsImportDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-semibold">Material Suppliers</h2>
        <div className="flex gap-2">
          {selectedSupplierId && (
            <Button 
              variant="outline" 
              className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              onClick={() => handleImportQuotes(selectedSupplierId)}
            >
              <Upload className="mr-1 h-4 w-4" />
              Import Quotes
            </Button>
          )}
          <Button onClick={() => setIsQuoteDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Quote
          </Button>
        </div>
      </div>
      
      {/* Search bar */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
        <Input
          placeholder="Search suppliers..."
          className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Display quotes view when a supplier is selected */}
      {selectedSupplierId ? (
        <SupplierQuotes 
          supplierId={selectedSupplierId} 
          onClose={() => setSelectedSupplierId(null)} 
        />
      ) : (
        /* Display suppliers grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-8">Loading suppliers...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No suppliers found.
            </div>
          ) : (
            filteredSuppliers.map(supplier => (
              <SupplierCard 
                key={supplier.id}
                supplier={supplier}
                onViewQuotes={handleViewQuotes}
              />
            ))
          )}
        </div>
      )}
      
      {/* Dialog for creating a new quote */}
      {selectedSupplierId && (
        <>
          <CreateQuoteDialog
            supplierId={selectedSupplierId}
            open={isQuoteDialogOpen}
            onOpenChange={setIsQuoteDialogOpen}
          />
          
          <ImportQuotesDialog
            supplierId={selectedSupplierId}
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
          />
        </>
      )}
    </div>
  );
}