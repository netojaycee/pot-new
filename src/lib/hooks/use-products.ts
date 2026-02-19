import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { endpoints, queryKeys } from "@/lib/endpoints";

// Types

export interface Images {
  url: string;
  pubId: string;
}


export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  type: string;
  stock: number;
  images: Images[];
  featured: boolean;
  categoryId: string;
  category?: any;
  soldCount?: number;
  reviewCount?: number;
  avgRating?: number;
  createdAt: string;
  updatedAt: string;
}


// Get all products
export function useProducts(filters?: {
  categoryId?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => apiClient.get<Product[]>(endpoints.products.list.path, filters as any),
  });
}

// Get product by ID or slug
export function useProduct(identifier: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(identifier),
    queryFn: () => apiClient.get<Product>(endpoints.products.byId(identifier).path),
    enabled: !!identifier,
  });
}

// Create product
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Product>) =>
      apiClient.post<Product>(endpoints.products.create.path, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      apiClient.patch<Product>(endpoints.products.update(id).path, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

// Delete product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(endpoints.products.delete(id).path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
