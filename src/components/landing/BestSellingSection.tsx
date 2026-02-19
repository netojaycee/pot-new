import { getProductsAction } from "@/lib/actions/product.actions";
import { ProductCard } from "@/components/product/ProductCard";

export async function BestSellingSection() {
  // Fetch products - you can add a filter for featured or best-selling
  const result = await getProductsAction({ limit: 4, offset: 0 });
  const products = result.success ? result.data : [];

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="px-4 lg:px-16 py-4">
      {/* Section Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Best Selling Gift Packages
        </h2>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
