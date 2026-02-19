import {
  getProductAction,
  getRelatedProductsAction,
} from "@/lib/actions/product.actions";
import { getProductReviewsAction } from "@/lib/actions/review.actions";
import { notFound } from "next/navigation";
import Image from "next/image";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Star } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Review } from "@prisma/generated";

interface ProductPageProps {
  params: Promise<{ slug: string; type: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, type } = await params;

  // Fetch product by slug using server action
  const result = await getProductAction(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const product = result.data;

  // Fetch real reviews
  const reviewsResult = await getProductReviewsAction(product.id, 10, 0);
  const reviews = reviewsResult.success ? reviewsResult.data : ([] as Review[]);

  // Fetch related products from same category
  const relatedResult = await getRelatedProductsAction(
    product.id,
    product.categoryId,
    4,
  );
  const relatedProducts = relatedResult.success
    ? relatedResult.data
    : ([] as typeof relatedResult.data);

  // Use product data or fallbacks for accordion content
  const whatIncluded = product.whatIncluded?.length
    ? product.whatIncluded
    : ([
        "Chocolate",
        "Chips",
        "Cookies",
        "Water",
        "Branded pen",
        "Crisps",
        "Biscuits",
      ] as string[]);

  const perfectFor = product.perfectFor?.length
    ? product.perfectFor
    : (["Anniversaries", "Employee incentives", "Casual Gifting"] as string[]);

  const whyChoose = product.whyChoose?.length
    ? product.whyChoose
    : [
        "Budget-friendly without compromising quality",
        "Seasonal and festive occasions",
        "Perfect gift for all ages and packaging occasions",
      ];

  const deliveryInfo = product.deliveryInfo || {
    title: "Royal Mail 24/7-verified Delivery - £4.50 | 2-4 days.",
    details: [
      "Acceptable ID includes a passport or driving license.",
      "If no suitable ID is provided, Royal Mail will leave instructions for redelivery or collection.",
    ],
  };

  return (
    <div className="bg-white">
      <div className="px-4 py-4 lg:px-16 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images - Column 1 */}
          <div>
            <ProductGallery images={product.images || []} />
          </div>

          {/* Product Details - Column 2 */}
          <div className="flex flex-col gap-3">
            {/* Product Header */}
            <div>
              {/* <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  +{product.type?.toUpperCase()}
                </Badge>
                {product.discountPercentage && (
                  <Badge variant="destructive" className="text-xs">
                    {Math.round(product.discountPercentage)}% OFF
                  </Badge>
                )}
              </div> */}

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {product.name}
              </h1>

              {/* Rating and Sales */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < Math.floor(product.avgRating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
                <span className="text-xs md:text-sm text-gray-600">
                  ({product.soldCount || 0}+ sold)
                </span>
              </div>
            </div>

            {/* What's Included */}
            <Accordion
              type="single"
              collapsible
              className="bg-[#E5E5E5]/30 p-2"
            >
              <AccordionItem value="included" className="border-0">
                <AccordionTrigger className="py-3 underline underline-offset-3 text-gray-900 font-semibold">
                  What&apos;s included?
                </AccordionTrigger>
                <AccordionContent className="pb-4 ">
                  <ul className="space-y-2">
                    {whatIncluded.map((item: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-700 flex items-start gap-2"
                      >
                        <span className="text-gray-400">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-2 mb-2 border-t border-b">
                <span className="text-2xl md:text-3xl font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.discountPercentage && (
                  <span className="text-sm md:text-base text-gray-500 line-through">
                    $
                    {(
                      product.price /
                      (1 - (product.discountPercentage || 0) / 100)
                    ).toFixed(2)}
                  </span>
                )}
              </div>
              {product.discountPercentage && product.discountExpiry && (
                <p className="text-xs text-red-600">
                  Discount expires:{" "}
                  {new Date(product.discountExpiry).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Viewing Info */}
            {/* <div className="text-xs text-gray-600">
              40 people are currently viewing this package
            </div> */}

            {/* Add to Cart Button */}
            <AddToCartButton productId={product.id} />
            <ReviewsSection
              averageRating={product.avgRating || 0}
              reviewCount={product.reviewCount || 0}
              reviews={reviews as any}
            />
          </div>
        </div>

        {/* Reviews Section */}
        {/* Additional Info Accordions */}
        <div className="mt-8 space-y-3">
          <Accordion type="single" collapsible className="bg-[#E5E5E5]/30 p-2">
            <AccordionItem value="perfect" className="">
              <AccordionTrigger className="px-4 py-3 underline underline-offset-3">
                Perfect For?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ul className="space-y-2">
                  {perfectFor.map((item: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-700 flex items-start gap-2"
                    >
                      <span className="text-gray-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible className="bg-[#E5E5E5]/30 p-2">
            <AccordionItem value="why" className="">
              <AccordionTrigger className="px-4 py-3 underline underline-offset-3">
                Why Choose this Package?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ul className="space-y-2">
                  {whyChoose.map((item: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-700 flex items-start gap-2"
                    >
                      <span className="text-gray-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible className="bg-[#E5E5E5]/30 p-2">
            <AccordionItem value="delivery" className="">
              <AccordionTrigger className="px-4 py-3 underline underline-offset-3">
                Delivery
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {deliveryInfo.title}
                  </p>
                  <ul className="space-y-2">
                    {deliveryInfo.details.map((detail: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-700 flex items-start gap-2"
                      >
                        <span className="text-gray-400">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* You May Also Like */}
        <div className="mt-12 border-t pt-8">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
            You may also like
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts &&
              relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
