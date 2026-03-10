"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { z } from "zod";

// Category validation schema
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  type: z.enum(["item", "food", "giftbox"]),
  parentId: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialData?: Partial<CategoryFormData> & { id?: string };
  categories: Array<{ id: string; name: string }>;
  isLoading?: boolean;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isEditing?: boolean;
}

export function CategoryForm({
  initialData,
  categories,
  isLoading = false,
  onSubmit,
  isEditing = false,
}: CategoryFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    type: initialData?.type || "item",
    parentId: initialData?.parentId || "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof CategoryFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value || undefined,
    }));
    if (errors[name as keyof CategoryFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = categorySchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Partial<Record<keyof CategoryFormData, string>> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([key, messages]) => {
        if (messages && messages.length > 0) {
          newErrors[key as keyof CategoryFormData] = messages[0];
        }
      });
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(result.data);
      toast.success(
        isEditing ? "Category updated successfully" : "Category created successfully",
      );
      router.push("/admin/categories");
    } catch (error) {
      console.error(error);
      toast.error(
        isEditing ? "Failed to update category" : "Failed to create category",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isFormLoading = isLoading || submitting;
  // Filter out current category from parent category options
  const availableParents = categories.filter((c) => c.id !== initialData?.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Category Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter category name"
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
          placeholder="Enter category description (optional)"
          disabled={isFormLoading}
        />
      </div>

      {/* Category Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Category Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleSelectChange("type", value)}
          disabled={isFormLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="item">Product</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="giftbox">Gift Box</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
      </div>

      {/* Parent Category */}
      <div className="space-y-2">
        <Label htmlFor="parentId">Parent Category</Label>
        <Select
          value={formData.parentId || ""}
          onValueChange={(value) => handleSelectChange("parentId", value)}
          disabled={isFormLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select parent category (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no parent">No Parent</SelectItem>
            {availableParents.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">Leave empty to create a top-level category</p>
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
          {isFormLoading ? "Saving..." : isEditing ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
