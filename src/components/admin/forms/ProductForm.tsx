"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { z } from "zod";

// Product validation schema
const productSchema = z.object({
  name: z.string().min(1, "Product name is required").min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  availableQuantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  categoryId: z.string().min(1, "Category is required"),
  type: z.enum(["item", "food", "giftbox"]),
  sku: z.string().optional(),
  lowStockThreshold: z.coerce.number().optional().default(5),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormData> & { id?: string };
  categories: Array<{ id: string; name: string; type?: "item" | "food" | "giftbox" }>;
  isLoading?: boolean;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isEditing?: boolean;
}

export function ProductForm({
  initialData,
  categories,
  isLoading = false,
  onSubmit,
  isEditing = false,
}: ProductFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    availableQuantity: initialData?.availableQuantity || 0,
    categoryId: initialData?.categoryId || "",
    type: initialData?.type || "item",
    sku: initialData?.sku || "",
    lowStockThreshold: initialData?.lowStockThreshold || 5,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter categories by the selected product type
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // If category has no type, include it (assume it's compatible)
      if (!cat.type) return true;
      // Match by type
      return cat.type === formData.type;
    });
  }, [categories, formData.type]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name as keyof ProductFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      // If type changed and current category doesn't match new type, clear categoryId
      if (name === "type") {
        const categoryStillValid = categories.find(
          (cat) => cat.id === prev.categoryId && (cat.type === value || !cat.type)
        );
        if (!categoryStillValid) {
          updated.categoryId = "";
        }
      }
      return updated;
    });
    if (errors[name as keyof ProductFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const result = productSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
      result.error.issues.forEach((issue: any) => {
        const path = issue.path[0] as keyof ProductFormData;
        newErrors[path] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(result.data);
      toast.success(
        isEditing ? "Product updated successfully" : "Product created successfully",
      );
      router.push("/admin/products");
    } catch (error) {
      console.error(error);
      toast.error(
        isEditing ? "Failed to update product" : "Failed to create product",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isFormLoading = isLoading || submitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter product name"
          disabled={isFormLoading}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          placeholder="Enter product description"
          disabled={isFormLoading}
        />
      </div>

      {/* Product Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Product Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleSelectChange("type", value)}
          disabled={isFormLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="item">Item</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="giftbox">Gift Box</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category *</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => handleSelectChange("categoryId", value)}
          disabled={isFormLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={filteredCategories.length === 0 ? "No categories available for this type" : "Select a category"} />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && (
          <p className="text-sm text-red-500">{errors.categoryId}</p>
        )}
        {filteredCategories.length === 0 && !isFormLoading && (
          <p className="text-xs text-yellow-600">No categories available for the selected product type</p>
        )}
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">Price (£) *</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={handleChange}
          placeholder="0.00"
          disabled={isFormLoading}
          className={errors.price ? "border-red-500" : ""}
        />
        {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
      </div>

      {/* SKU */}
      <div className="space-y-2">
        <Label htmlFor="sku">SKU</Label>
        <Input
          id="sku"
          name="sku"
          value={formData.sku || ""}
          onChange={handleChange}
          placeholder="Enter SKU (optional)"
          disabled={isFormLoading}
        />
      </div>

      {/* Available Quantity */}
      <div className="space-y-2">
        <Label htmlFor="availableQuantity">Available Quantity *</Label>
        <Input
          id="availableQuantity"
          name="availableQuantity"
          type="number"
          min="0"
          value={formData.availableQuantity}
          onChange={handleChange}
          placeholder="0"
          disabled={isFormLoading}
          className={errors.availableQuantity ? "border-red-500" : ""}
        />
        {errors.availableQuantity && (
          <p className="text-sm text-red-500">{errors.availableQuantity}</p>
        )}
      </div>

      {/* Low Stock Threshold */}
      <div className="space-y-2">
        <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
        <Input
          id="lowStockThreshold"
          name="lowStockThreshold"
          type="number"
          min="0"
          value={formData.lowStockThreshold || 5}
          onChange={handleChange}
          placeholder="5"
          disabled={isFormLoading}
        />
        <p className="text-xs text-gray-500">Alert when stock falls below this number</p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isFormLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isFormLoading}>
          {isFormLoading ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
