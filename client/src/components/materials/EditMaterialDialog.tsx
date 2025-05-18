import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import { SimplifiedMaterial } from "@/components/materials/MaterialCard";

interface EditMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: SimplifiedMaterial | any; // Allow any for flexibility
}

export function EditMaterialDialog({ open, onOpenChange, material }: EditMaterialDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    quantity: 0,
    unit: "",
    cost: 0,
    status: "",
    details: "",
    quoteNumber: "",
    quoteDate: "",
    orderDate: "",
    isQuote: true,
    supplierId: 0,
    supplier: "",
    category: "",
    tier: "",
    tier2Category: "",
    section: "",
    subsection: "",
    materialSize: ""
  });
  
  // Get all contacts for supplier selection
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
  });
  
  // Create filtered list of suppliers (contacts with role containing "supplier")
  const suppliers = contacts.filter((contact: any) => 
    contact.role && contact.role.toLowerCase().includes("supplier")
  );
  
  // Populate form with material data when it changes
  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || "",
        type: material.type || "",
        quantity: material.quantity || 0,
        unit: material.unit || "",
        cost: material.cost || 0,
        status: material.status || "pending",
        details: material.details || "",
        quoteNumber: material.quoteNumber || "",
        quoteDate: material.quoteDate ? material.quoteDate.split('T')[0] : "",
        orderDate: material.orderDate ? material.orderDate.split('T')[0] : "",
        isQuote: material.isQuote === false ? false : true,
        supplierId: material.supplierId || 0,
        supplier: material.supplier || "",
        category: material.category || "",
        tier: material.tier || material.tier1Category || "",
        tier2Category: material.tier2Category || "",
        section: material.section || "",
        subsection: material.subsection || "",
        materialSize: material.materialSize || ""
      });
    }
  }, [material]);
  
  // Create mutation for updating material
  const updateMaterialMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      return apiRequest(`/api/materials/${material.id}`, "PUT", updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      
      toast({
        title: "Success",
        description: formData.isQuote 
          ? "Quote has been updated successfully"
          : "Material has been updated successfully",
      });
      
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating material:", error);
      toast({
        title: "Error",
        description: "Failed to update the material",
        variant: "destructive",
      });
    }
  });
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Handle checkbox/switch changes
  const handleBooleanChange = (field: string, value: boolean) => {
    setFormData({ ...formData, [field]: value });
  };
  
  // Handle supplier selection
  const handleSupplierChange = (value: string) => {
    if (value === "none") {
      setFormData({ ...formData, supplierId: 0, supplier: "" });
      return;
    }
    
    const selectedSupplier = suppliers.find((s: any) => s.id.toString() === value);
    if (selectedSupplier) {
      setFormData({
        ...formData,
        supplierId: selectedSupplier.id,
        supplier: selectedSupplier.name
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Prepare data for update
      const updates = {
        ...formData,
        // Convert quantity and cost to numbers
        quantity: Number(formData.quantity),
        cost: Number(formData.cost),
        // Ensure projectId is preserved
        projectId: material.projectId,
        // Convert empty strings to null for optional fields
        quoteDate: formData.quoteDate || null,
        orderDate: formData.orderDate || null,
        supplierId: formData.supplierId || null,
        details: formData.details || null,
        section: formData.section || null,
        subsection: formData.subsection || null,
        materialSize: formData.materialSize || null
      };
      
      await updateMaterialMutation.mutateAsync(updates);
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Convert status to display name
  const getStatusDisplayName = (status: string) => {
    if (!status) return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  // Get available status options
  const getStatusOptions = () => {
    const baseOptions = ["pending", "ordered", "delivered", "received", "installed"];
    
    // If it's a quote, add quote-specific statuses
    if (formData.isQuote) {
      return ["quoted", "approved", "rejected", ...baseOptions];
    }
    
    return baseOptions;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formData.isQuote ? "Edit Quote" : "Edit Material"}
          </DialogTitle>
          <DialogDescription>
            Update the details for this {formData.isQuote ? "quote" : "material"}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materialSize">Size/Dimensions</Label>
                <Input
                  id="materialSize"
                  name="materialSize"
                  value={formData.materialSize}
                  placeholder="e.g., 2x4, 4'x8', etc."
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  name="unit"
                  placeholder="e.g., sheets, feet, etc."
                  value={formData.unit}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost per Unit ($)</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          {/* Quote-specific Information */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-md font-medium">Quote Details</h3>
                <p className="text-sm text-muted-foreground">
                  Mark as quote to track as a price quote instead of an ordered material
                </p>
              </div>
              <Switch
                checked={formData.isQuote}
                onCheckedChange={(checked) => handleBooleanChange("isQuote", checked)}
              />
            </div>
            
            {formData.isQuote && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quoteNumber">Quote Number</Label>
                    <Input
                      id="quoteNumber"
                      name="quoteNumber"
                      value={formData.quoteNumber}
                      onChange={handleChange}
                      placeholder="e.g., Q12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quoteDate">Quote Date</Label>
                    <Input
                      id="quoteDate"
                      name="quoteDate"
                      type="date"
                      value={formData.quoteDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier</Label>
                  <Select
                    value={formData.supplierId ? formData.supplierId.toString() : "none"}
                    onValueChange={handleSupplierChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {suppliers.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {!formData.isQuote && (
              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date</Label>
                <Input
                  id="orderDate"
                  name="orderDate"
                  type="date"
                  value={formData.orderDate}
                  onChange={handleChange}
                />
              </div>
            )}
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {getStatusOptions().map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusDisplayName(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Categorization */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-md font-medium mb-4">Categorization</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tier">Primary Category</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value) => setFormData({ ...formData, tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="systems">Systems</SelectItem>
                    <SelectItem value="sheathing">Sheathing</SelectItem>
                    <SelectItem value="finishings">Finishings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier2Category">Secondary Category</Label>
                <Input
                  id="tier2Category"
                  name="tier2Category"
                  value={formData.tier2Category}
                  onChange={handleChange}
                  placeholder="e.g., Lumber, Plumbing, etc."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="e.g., Bathroom, Kitchen, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subsection">Subsection</Label>
                <Input
                  id="subsection"
                  name="subsection"
                  value={formData.subsection}
                  onChange={handleChange}
                  placeholder="e.g., Shower, Countertop, etc."
                />
              </div>
            </div>
          </div>
          
          {/* Additional Details */}
          <div className="border-t pt-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="details">Additional Details</Label>
              <Textarea
                id="details"
                name="details"
                value={formData.details || ""}
                onChange={handleChange}
                placeholder="Add any additional information about this item..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}