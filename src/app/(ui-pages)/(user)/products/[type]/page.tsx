import { ProductGrid } from "@/components/product/ProductGrid";
import { getProductsAction } from "@/lib/actions/product.actions";

interface SearchParams {
  page?: string;
  sortBy?: string;
  minPrice?: string;
  maxPrice?: string;
  sizes?: string;
  fits?: string;
  materials?: string;
  minRating?: string;
}

export default async function ProductsByCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { categorySlug } = await params;
  const paramValues = await searchParams;
  const page = parseInt(paramValues.page || "1", 10);
  const limit = 10;
  const offset = (page - 1) * limit;
  const sortBy = (paramValues.sortBy || "newest") as "newest" | "popular" | "price_asc" | "price_desc" | "rating";

  // Parse filter params
  const minPrice = paramValues.minPrice ? Number(paramValues.minPrice) : undefined;
  const maxPrice = paramValues.maxPrice ? Number(paramValues.maxPrice) : undefined;
  const sizes = paramValues.sizes ? paramValues.sizes.split(",") : undefined;
  const fits = paramValues.fits ? paramValues.fits.split(",") : undefined;
  const materials = paramValues.materials ? paramValues.materials.split(",") : undefined;
  const minRating = paramValues.minRating ? Number(paramValues.minRating) : undefined;

  const initialFilters = { minPrice, maxPrice, sizes, fits, materials, minRating };

  let res;
  if (categorySlug === "store" || categorySlug === "catalog") {
    res = await getProductsAction({ 
      type: categorySlug as "item" | "food" | "giftbox", 
      limit, 
      offset, 
      sortBy,
      minPrice,
      maxPrice,
      minRating,
    });
  } else {
    res = await getProductsAction({ 
      category: categorySlug, 
      limit, 
      offset, 
      sortBy,
      minPrice,
      maxPrice,
      minRating,
    });
  }

  const products = res.success ? (res.data ?? []) : [];
  const total = res.total ?? 0;
  const pageCount = Math.ceil(total / limit);

  return (
    <div className="px-4 py-4 lg:px-16 md:py-8">
      <ProductGrid
        products={products}
        page={page}
        pageCount={pageCount}
        baseUrl={`/products/${categorySlug}`}
        sortBy={sortBy}
        initialFilters={initialFilters}
      />
    </div>
  );
}