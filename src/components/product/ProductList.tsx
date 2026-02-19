import { getProductsAction } from "@/lib/actions/product.actions";
import { ProductCard } from "./ProductCard";

export async function ProductList({ limit = 8 }: { limit?: number } = {}) {
  const result = await getProductsAction({ limit, offset: 0 });
  const products = result.success ? result.data : [];

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">No products found.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
