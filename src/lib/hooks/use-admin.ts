import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductStatusAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  bulkUpdateStockAction,
  bulkUpdatePricesAction,
} from "@/lib/actions/admin.actions";
import {
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/services/admin.service";

// ============ QUERY KEYS ============

const adminQueryKeys = {
  all: ["admin"] as const,
  products: () => [...adminQueryKeys.all, "products"] as const,
  product: (id: string) => [...adminQueryKeys.all, "product", id] as const,
  categories: () => [...adminQueryKeys.all, "categories"] as const,
  category: (id: string) => [...adminQueryKeys.all, "category", id] as const,
};

// ============ ADMIN PRODUCT HOOKS ============

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const result = await createProductAction(input);
      if (!result.success) throw new Error(result.error);
    //   return result.data;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.products() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      data,
    }: {
      productId: string;
      data: UpdateProductInput;
    }) => {
      const result = await updateProductAction(productId, data);
      if (!result.success) throw new Error(result.error);
      //   return result.data;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.product((data as any).id),
      });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.products() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const result = await deleteProductAction(productId);
      if (!result.success) throw new Error(result.error);
      //   return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.products() });
    },
  });
}

export function useToggleProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      isActive,
    }: {
      productId: string;
      isActive: boolean;
    }) => {
      const result = await toggleProductStatusAction(productId, isActive);
      if (!result.success) throw new Error(result.error);
      //   return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.product((data as any).id),
      });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.products() });
    },
  });
}

export function useBulkUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updates: Array<{ productId: string; stock: number }>,
    ) => {
      const result = await bulkUpdateStockAction(updates);
      if (!result.success) throw new Error(result.error);
      //   return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.products() });
    },
  });
}

export function useBulkUpdatePrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updates: Array<{ productId: string; price: number }>,
    ) => {
      const result = await bulkUpdatePricesAction(updates);
      if (!result.success) throw new Error(result.error);
      //   return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.products() });
    },
  });
}

// ============ ADMIN CATEGORY HOOKS ============

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const result = await createCategoryAction(input);
      if (!result.success) throw new Error(result.error);
      //   return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: UpdateCategoryInput;
    }) => {
      const result = await updateCategoryAction(categoryId, data);
      if (!result.success) throw new Error(result.error);
      //   return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.category((data as any).id),
      });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories() });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const result = await deleteCategoryAction(categoryId);
      if (!result.success) throw new Error(result.error);
      //   return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories() });
    },
  });
}
