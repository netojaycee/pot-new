import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/hooks/use-products";
import { Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const rating = product.avgRating || 0;
  const soldCount = product.soldCount || 0;
  const categoryName =
    product.category?.name || product.type?.toUpperCase() || "PRODUCT";

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <Link prefetch={true} href={`/product/${product.type}/${product.slug}`}>
      <div className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.images?.[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-200">
              <span className="text-sm text-gray-500">No Image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 space-y-2">
          {/* Category Badge */}
          <div className="uppercase flex items-center">
            <span className="rounded-full border h-2 w-2 bg-[#FB3748] mr-1"></span>
            <p className="text-xs text-gray-400">{categoryName}</p>
          </div>
          {/* <p className="text-xs font-semibold text-gray-500 uppercase">
            +{categoryName}
          </p> */}

          {/* Product Name */}
          <h3 className="underline text-sm font-semibold text-gray-900 line-clamp-1">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-600 line-clamp-2 h-8">
            {product.description}
          </p>

          {/* Rating and Sold Count */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">{renderStars(rating)}</div>
            <p className="text-xs text-gray-500">
              {soldCount > 0 ? `${soldCount}+ sold` : "0 sold"}
            </p>
          </div>

          {/* Price */}
          <p className="text-lg font-bold text-gray-900 pt-1">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </div>
    </Link>
  );
}
