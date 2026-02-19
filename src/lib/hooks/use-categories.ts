import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { endpoints, queryKeys } from "@/lib/endpoints";

// Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

// Get all categories
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => apiClient.get<Category[]>(endpoints.categories.list.path),
  });
}

// Get category by ID or slug
export function useCategory(identifier: string) {
  return useQuery({
    queryKey: queryKeys.categories.detail(identifier),
    queryFn: () => apiClient.get<Category>(endpoints.categories.byId(identifier).path),
    enabled: !!identifier,
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Category>) =>
      apiClient.post<Category>(endpoints.categories.create.path, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      apiClient.patch<Category>(endpoints.categories.update(id).path, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(endpoints.categories.delete(id).path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
