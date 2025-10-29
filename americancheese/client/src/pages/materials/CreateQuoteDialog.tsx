import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, FileText, Plus, X } from "lucide-react";

import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Quote form schema with validation
const quoteFormSchema = z.object({
  // Basic quote information
  quoteNumber: z.string().min(1, "Quote number is required"),
  quoteDate: z.string().min(1, "Quote date is required"),
  supplierId: z.number().nullable(),
  supplier: z.string().min(1, "Supplier is required"),
  
  // Project association
  projectId: z.number(),
  
  // Quote items (materials)
  materials: z.array(
    z.object({
      name: z.string().min(1, "Material name is required"),
      materialSize: z.string().optional(),
      type: z.string().min(1, "Material type is required"),
      category: z.string().min(1, "Category is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unit: z.string().optional(),
      cost: z.number().min(0, "Cost cannot be negative"),
      tier: z.string().optional(),
      tier2Category: z.string().optional(),
      section: z.string().optional(),
      subsection: z.string().optional(),
    })
  ).min(1, "At least one material must be added to the quote"),
  
  // Additional quote details
  notes: z.string().optional(),
  expirationDate: z.string().optional(),
  deliveryTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

// Material types for the dropdown
const materialTypes = [
  "Building Materials",
  "Appliances",
  "Bath & Faucets",
  "Electrical",
  "Flooring",
  "Hardware",
  "Plumbing",
  "HVAC & Fans",
  "Kitchens & Dining",
  "Paint",
  "Lighting & Ceiling Fans",
  "Doors & Windows",
  "Other Materials"
];

// Interface for material categories - will be populated based on selected type
const materialTypeCategories: Record<string, string[]> = {
  "Building Materials": [
    "Lumber & Composites",
    "Concrete, Cement & Masonry",
    "Decking",
    "Fencing",
    "Dimensional Lumber",
    "Building Hardware",
  ],
  "Appliances": [
    "Kitchen Appliance Packages",
    "Refrigerators",
    "Ranges",
    "Dishwashers",
  ],
  // Abbreviated for brevity - add more as needed
};

interface CreateQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
}

export function CreateQuoteDialog({
  open,
  onOpenChange,
  projectId,
}: CreateQuoteDialogProps) {
  const queryClient = useQueryClient();
  const [materialRows, setMaterialRows] = useState<any[]>([{ id: 1 }]);
  
  // Generate a unique quote number with date and random digits
  const generateQuoteNumber = () => {
    const today = new Date();
    const dateStr = format(today, "yyyyMMdd");
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `Q-${dateStr}-${randomNum}`;
  };

  // Form setup
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      quoteNumber: generateQuoteNumber(),
      quoteDate: format(new Date(), "yyyy-MM-dd"),
      supplierId: null,
      supplier: "",
      projectId,
      materials: [
        {
          name: "",
          materialSize: "",
          type: "",
          category: "",
          quantity: 1,
          unit: "pieces",
          cost: 0,
          tier: "structural",
          tier2Category: "",
          section: "",
          subsection: "",
        },
      ],
      notes: "",
      expirationDate: "",
      deliveryTerms: "",
      paymentTerms: "",
    },
  });

  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/contacts'],
    enabled: open,
  });

  // Filter to only show suppliers
  const supplierContacts = suppliers.filter((contact: any) => 
    contact.type === 'supplier'
  );

  // Submit handler
  const createQuote = useMutation({
    mutationFn: async (data: QuoteFormValues) => {
      // Create materials with quote info
      const materials = data.materials.map(material => ({
        ...material,
        quoteNumber: data.quoteNumber,
        quoteDate: data.quoteDate,
        supplier: data.supplier,
        supplierId: data.supplierId,
        projectId: data.projectId,
        isQuote: true,
        status: "quoted",
      }));
      
      // Create each material in the quote
      return Promise.all(
        materials.map(material => 
          apiRequest('/api/materials', 'POST', material)
        )
      );
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'materials'] });
      
      // Close the dialog
      onOpenChange(false);
      
      // Reset form
      form.reset();
      setMaterialRows([{ id: 1 }]);
    },
  });

  // Add new material row
  const addMaterialRow = () => {
    setMaterialRows([
      ...materialRows, 
      { 
        id: Date.now() // Use timestamp as unique ID
      }
    ]);
    
    // Add new empty material to form data
    const currentMaterials = form.getValues("materials") || [];
    form.setValue("materials", [
      ...currentMaterials, 
      {
        name: "",
        materialSize: "",
        type: "",
        category: "",
        quantity: 1,
        unit: "pieces",
        cost: 0,
        tier: "structural",
        tier2Category: "",
        section: "",
        subsection: "",
      }
    ]);
  };

  // Remove material row
  const removeMaterialRow = (index: number) => {
    if (materialRows.length <= 1) return; // Keep at least one row
    
    const updatedRows = materialRows.filter((_, i) => i !== index);
    setMaterialRows(updatedRows);
    
    // Update form data
    const currentMaterials = form.getValues("materials") || [];
    const updatedMaterials = currentMaterials.filter((_, i) => i !== index);
    form.setValue("materials", updatedMaterials);
  };

  // Handle supplier change
  const handleSupplierChange = (supplierId: string) => {
    const selectedSupplier = supplierContacts.find(
      (contact: any) => contact.id.toString() === supplierId
    );
    
    if (selectedSupplier) {
      form.setValue("supplierId", parseInt(supplierId));
      form.setValue("supplier", selectedSupplier.name);
    }
  };

  // When form submits
  async function onSubmit(data: QuoteFormValues) {
    createQuote.mutate(data);
  }

  // Create materials section for form
  const renderMaterialRows = () => {
    return materialRows.map((row, index) => (
      <div key={row.id} className="p-4 border rounded-md mb-3 bg-slate-50 relative">
        {/* Remove button */}
        {materialRows.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            onClick={() => removeMaterialRow(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Material Name */}
          <FormField
            control={form.control}
            name={`materials.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter material name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Material Size */}
          <FormField
            control={form.control}
            name={`materials.${index}.materialSize`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material Size</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., 2x4, 4x8, 1/2 inch" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Material Type */}
          <FormField
            control={form.control}
            name={`materials.${index}.type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear category when type changes
                    form.setValue(`materials.${index}.category`, "");
                  }}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material type" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Material Category */}
          <FormField
            control={form.control}
            name={`materials.${index}.category`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!form.watch(`materials.${index}.type`)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const type = form.watch(`materials.${index}.type`);
                      if (type && materialTypeCategories[type]) {
                        return materialTypeCategories[type].map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ));
                      }
                      return <SelectItem value="other">Other</SelectItem>;
                    })()}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quantity */}
          <FormField
            control={form.control}
            name={`materials.${index}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Unit */}
          <FormField
            control={form.control}
            name={`materials.${index}.unit`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="sq ft">Square Feet</SelectItem>
                    <SelectItem value="linear ft">Linear Feet</SelectItem>
                    <SelectItem value="yards">Yards</SelectItem>
                    <SelectItem value="gallons">Gallons</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="sets">Sets</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Cost per Unit */}
          <FormField
            control={form.control}
            name={`materials.${index}.cost`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost per Unit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter cost"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Quote
          </DialogTitle>
          <DialogDescription>
            Create a quote with multiple materials from a supplier
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Quote Info Section */}
            <div className="rounded-lg border p-4 bg-slate-50">
              <h3 className="text-lg font-medium mb-4 text-slate-800">Quote Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quote Number */}
                <FormField
                  control={form.control}
                  name="quoteNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter quote number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Auto-generated unique quote ID
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Quote Date */}
                <FormField
                  control={form.control}
                  name="quoteDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Quote Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Supplier */}
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select
                        onValueChange={(value) => handleSupplierChange(value)}
                        value={field.value?.toString() || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {supplierContacts.map((supplier: any) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Expiration Date */}
                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiration Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                            disabled={(date) =>
                              date < new Date() || date > new Date(2100, 0, 1)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Optional - when this quote expires
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Additional Quote Details */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deliveryTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Terms</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., 5-7 business days" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Net 30, Due on receipt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes or special instructions" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Materials Section */}
            <div className="rounded-lg border p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-800">Materials</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addMaterialRow}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Material
                </Button>
              </div>
              
              {renderMaterialRows()}
              
              {form.formState.errors.materials?.message && (
                <p className="text-red-500 text-sm mt-2">{form.formState.errors.materials.message}</p>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createQuote.isPending}
              >
                {createQuote.isPending ? "Creating Quote..." : "Create Quote"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}