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

// Promo Code validation schema
const promoCodeSchema = z.object({
  code: z.string()
    .min(1, "Code is required")
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code must not exceed 20 characters")
    .toUpperCase(),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().min(0.01, "Value must be greater than 0"),
  minOrder: z.coerce.number().optional(),
  maxUses: z.coerce.number().optional(),
  expiryDate: z.string().optional(),
  active: z.boolean().default(true),
});

type PromoCodeFormData = z.infer<typeof promoCodeSchema>;

interface PromoCodeFormProps {
  initialData?: Partial<PromoCodeFormData> & { id?: string };
  isLoading?: boolean;
  onSubmit: (data: PromoCodeFormData) => Promise<void>;
  isEditing?: boolean;
}

export function PromoCodeForm({
  initialData,
  isLoading = false,
  onSubmit,
  isEditing = false,
}: PromoCodeFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<PromoCodeFormData>({
    code: initialData?.code || "",
    type: initialData?.type || "percent",
    value: initialData?.value || 0,
    minOrder: initialData?.minOrder,
    maxUses: initialData?.maxUses,
    expiryDate: initialData?.expiryDate || "",
    active: initialData?.active ?? true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PromoCodeFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    if (errors[name as keyof PromoCodeFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof PromoCodeFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form with code transformation
    const dataToValidate = {
      ...formData,
      code: formData.code.toUpperCase(),
    };

    const result = promoCodeSchema.safeParse(dataToValidate);
    if (!result.success) {
      const newErrors: Partial<Record<keyof PromoCodeFormData, string>> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([key, messages]) => {
        if (messages && messages.length > 0) {
          newErrors[key as keyof PromoCodeFormData] = messages[0];
        }
      });
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(result.data);
      toast.success(
        isEditing ? "Promo code updated successfully" : "Promo code created successfully",
      );
      router.push("/admin/promo-codes");
    } catch (error) {
      console.error(error);
      toast.error(
        isEditing ? "Failed to update promo code" : "Failed to create promo code",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isFormLoading = isLoading || submitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Promo Code */}
      <div className="space-y-2">
        <Label htmlFor="code">Promo Code *</Label>
        <Input
          id="code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder="e.g., SUMMER20"
          disabled={isFormLoading || isEditing}
          className={errors.code ? "border-red-500" : ""}
        />
        {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
        {isEditing && <p className="text-xs text-gray-500">Code cannot be changed after creation</p>}
      </div>

      {/* Discount Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Discount Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleSelectChange("type", value)}
          disabled={isFormLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">Percentage</SelectItem>
            <SelectItem value="fixed">Fixed Amount</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
      </div>

      {/* Discount Value */}
      <div className="space-y-2">
        <Label htmlFor="value">
          Discount Value {formData.type === "percent" ? "(%)" : "(£)"} *
        </Label>
        <Input
          id="value"
          name="value"
          type="number"
          step={formData.type === "percent" ? "0.1" : "0.01"}
          min="0"
          max={formData.type === "percent" ? "100" : undefined}
          value={formData.value}
          onChange={handleChange}
          placeholder={formData.type === "percent" ? "e.g., 20" : "e.g., 10.00"}
          disabled={isFormLoading}
          className={errors.value ? "border-red-500" : ""}
        />
        {errors.value && <p className="text-sm text-red-500">{errors.value}</p>}
      </div>

      {/* Minimum Order */}
      <div className="space-y-2">
        <Label htmlFor="minOrder">Minimum Order Amount (£)</Label>
        <Input
          id="minOrder"
          name="minOrder"
          type="number"
          step="0.01"
          min="0"
          value={formData.minOrder || ""}
          onChange={handleChange}
          placeholder="No minimum (optional)"
          disabled={isFormLoading}
        />
        <p className="text-xs text-gray-500">Leave empty for no minimum requirement</p>
      </div>

      {/* Maximum Uses */}
      <div className="space-y-2">
        <Label htmlFor="maxUses">Maximum Uses</Label>
        <Input
          id="maxUses"
          name="maxUses"
          type="number"
          min="0"
          value={formData.maxUses || ""}
          onChange={handleChange}
          placeholder="Unlimited (optional)"
          disabled={isFormLoading}
        />
        <p className="text-xs text-gray-500">Leave empty for unlimited uses</p>
      </div>

      {/* Expiry Date */}
      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <Input
          id="expiryDate"
          name="expiryDate"
          type="date"
          value={formData.expiryDate || ""}
          onChange={handleChange}
          disabled={isFormLoading}
        />
        <p className="text-xs text-gray-500">Leave empty for no expiry date</p>
      </div>

      {/* Active Status */}
      <div className="flex items-center space-x-2">
        <input
          id="active"
          name="active"
          type="checkbox"
          checked={formData.active}
          onChange={handleChange}
          disabled={isFormLoading}
          className="w-4 h-4 rounded border-gray-300"
        />
        <Label htmlFor="active" className="mb-0">
          Active (code can be used)
        </Label>
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
          {isFormLoading ? "Saving..." : isEditing ? "Update Code" : "Create Code"}
        </Button>
      </div>
    </form>
  );
}
