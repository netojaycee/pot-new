"use client";

import { useState, useMemo, useRef, KeyboardEvent } from "react";
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
import { X, ImagePlus, Loader2 } from "lucide-react";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  availableQuantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  categoryId: z.string().min(1, "Category is required"),
  type: z.enum(["item", "food", "giftbox"]),
});

type ProductFormData = z.infer<typeof productSchema>;
type ImageEntry = { url: string; pubId: string };
type DeliveryInfo = { title: string; details: string[] };

interface ProductFormProps {
  initialData?: Partial<ProductFormData> & {
    id?: string;
    images?: ImageEntry[];
    whatIncluded?: string[];
    perfectFor?: string[];
    whyChoose?: string[];
    deliveryInfo?: DeliveryInfo | null;
  };
  categories: Array<{ id: string; name: string; type?: "item" | "food" | "giftbox" }>;
  isLoading?: boolean;
  onSubmit: (
    data: ProductFormData & {
      images: ImageEntry[];
      whatIncluded: string[];
      perfectFor: string[];
      whyChoose: string[];
      deliveryInfo?: DeliveryInfo;
    }
  ) => Promise<void>;
  isEditing?: boolean;
}

// ── small reusable tag-list input ──────────────────────────────────────────
function TagInput({
  label,
  placeholder,
  values,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setDraft("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          disabled={disabled}
        />
        <Button type="button" variant="outline" onClick={add} disabled={disabled || !draft.trim()}>
          Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                disabled={disabled}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────

export function ProductForm({
  initialData,
  categories,
  isLoading = false,
  onSubmit,
  isEditing = false,
}: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    availableQuantity: initialData?.availableQuantity || 0,
    categoryId: initialData?.categoryId || "",
    type: initialData?.type || "item",
  });

  const [images, setImages] = useState<ImageEntry[]>(initialData?.images || []);
  const [whatIncluded, setWhatIncluded] = useState<string[]>(initialData?.whatIncluded || []);
  const [perfectFor, setPerfectFor] = useState<string[]>(initialData?.perfectFor || []);
  const [whyChoose, setWhyChoose] = useState<string[]>(initialData?.whyChoose || []);
  const [deliveryTitle, setDeliveryTitle] = useState(initialData?.deliveryInfo?.title || "");
  const [deliveryDetails, setDeliveryDetails] = useState<string[]>(
    initialData?.deliveryInfo?.details || []
  );

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData | "images", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (cat) => !cat.type || cat.type === formData.type || cat.id === formData.categoryId
    );
  }, [categories, formData.type, formData.categoryId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ProductFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "type") {
        const categoryStillValid = categories.find(
          (cat) => cat.id === prev.categoryId && (cat.type === value || !cat.type)
        );
        if (!categoryStillValid) updated.categoryId = "";
      }
      return updated;
    });
    if (errors[name as keyof ProductFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    try {
      const { uploadProductImageAction } = await import("@/lib/actions/product.actions");
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadProductImageAction(fd);
      if (!result.success || !result.data) {
        toast.error(result.error || "Upload failed");
        return;
      }
      setImages((prev) => [...prev, result.data!]);
      setErrors((prev) => ({ ...prev, images: undefined }));
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (pubId: string) => {
    setImages((prev) => prev.filter((img) => img.pubId !== pubId));
    import("@/lib/actions/product.actions").then(({ deleteProductImageAction }) => {
      deleteProductImageAction(pubId).catch(console.error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = productSchema.safeParse(formData);
    const newErrors: Partial<Record<keyof ProductFormData | "images", string>> = {};

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof ProductFormData;
        newErrors[path] = issue.message;
      });
    }

    if (images.length === 0) {
      newErrors.images = "At least one image is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const deliveryInfo =
      deliveryTitle.trim() || deliveryDetails.length > 0
        ? { title: deliveryTitle.trim(), details: deliveryDetails }
        : undefined;

    setSubmitting(true);
    try {
      await onSubmit({
        ...result.data!,
        images,
        whatIncluded,
        perfectFor,
        whyChoose,
        deliveryInfo,
      });
      toast.success(isEditing ? "Product updated successfully" : "Product created successfully");
      router.push("/admin/products");
    } catch (error) {
      console.error(error);
      toast.error(isEditing ? "Failed to update product" : "Failed to create product");
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
        <Label htmlFor="description">Description *</Label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter product description"
          disabled={isFormLoading}
          rows={4}
          className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 ${errors.description ? "border-red-500" : "border-input"}`}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
      </div>

      {/* Product Type */}
      <div className="space-y-2">
        <Label>Product Type *</Label>
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
        <Label>Category *</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => handleSelectChange("categoryId", value)}
          disabled={isFormLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                filteredCategories.length === 0
                  ? "No categories for this type"
                  : "Select a category"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId}</p>}
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

      {/* Images */}
      <div className="space-y-2">
        <Label>Images *</Label>
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.pubId} className="relative h-24 w-24 rounded-md overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(img.pubId)}
                disabled={isFormLoading}
                className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isFormLoading || uploading}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">Add Image</span>
              </>
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {errors.images && <p className="text-sm text-red-500">{errors.images}</p>}
      </div>

      {/* Divider */}
      <hr className="border-dashed" />
      <p className="text-sm font-semibold text-gray-700">Product Detail Sections (shown on product page)</p>

      {/* What's Included */}
      <TagInput
        label="What's Included"
        placeholder='e.g. "Chocolate" — press Enter or click Add'
        values={whatIncluded}
        onChange={setWhatIncluded}
        disabled={isFormLoading}
      />

      {/* Perfect For */}
      <TagInput
        label="Perfect For"
        placeholder='e.g. "Anniversaries" — press Enter or click Add'
        values={perfectFor}
        onChange={setPerfectFor}
        disabled={isFormLoading}
      />

      {/* Why Choose */}
      <TagInput
        label="Why Choose This Package"
        placeholder='e.g. "Budget-friendly without compromising quality"'
        values={whyChoose}
        onChange={setWhyChoose}
        disabled={isFormLoading}
      />

      {/* Delivery Info */}
      <div className="space-y-3">
        <Label>Delivery Info</Label>
        <Input
          value={deliveryTitle}
          onChange={(e) => setDeliveryTitle(e.target.value)}
          placeholder='e.g. "Royal Mail 24/7 Delivery — £4.50 | 2-4 days"'
          disabled={isFormLoading}
        />
        <TagInput
          label="Delivery Details"
          placeholder='e.g. "Acceptable ID includes a passport or driving license"'
          values={deliveryDetails}
          onChange={setDeliveryDetails}
          disabled={isFormLoading}
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-6">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isFormLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isFormLoading}>
          {isFormLoading ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
