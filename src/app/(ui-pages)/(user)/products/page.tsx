import { ProductGrid } from "@/components/product/ProductGrid";
import { getProductsAction } from "@/lib/actions/product.actions";
import React from "react";

interface SearchParams {
  page?: string;
  search?: string;
  sortBy?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
}

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;
  const sortBy = (params.sortBy || "newest") as "newest" | "popular" | "price_asc" | "price_desc" | "rating";
  const search = params.search;

  // Parse filter params
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const minRating = params.minRating ? Number(params.minRating) : undefined;

  const initialFilters = { minPrice, maxPrice, minRating };

  const res = await getProductsAction({ 
    limit, 
    offset, 
    sortBy,
    search,
    minPrice,
    maxPrice,
    minRating,
  });
  const products = res.success ? (res.data ?? []) : [];
  const total = res.total ?? 0;
  const pageCount = Math.ceil(total / limit);

  return (
    <div className="px-4 py-4 lg:px-16 md:py-8">
      <ProductGrid
        products={products}
        page={page}
        pageCount={pageCount}
        baseUrl="/products"
        sortBy={sortBy}
        initialFilters={initialFilters}
        search={search}
      />
    </div>
  );
}
