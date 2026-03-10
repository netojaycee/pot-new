import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getCategoriesAction } from "@/lib/actions/category.actions";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ProductPagination } from "@/components/product/ProductPagination";

interface SearchParams {
  page?: string;
}

export default async function AllCategoriesPage({
   params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { type } = await params as { type: "item" | "food" | "giftbox" };
  const paramValues = await searchParams;
  const page = parseInt(paramValues.page || "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  const res = await getCategoriesAction({ type, limit, offset });
  const categories = res.success ? res.data : [];
  const total = (res as any).total ?? 0;
  const pageCount = Math.ceil(total / limit);
console.log("Categories:", categories);
  return (
    <div className="px-4 py-4 lg:px-16 md:py-8">
      <h1 className="text-2xl font-bold mb-6">Shop</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories &&
          categories.map((cat: any) => (
            <Link key={cat.id} href={`/products/${cat.slug}`} className="group">
              <Card className="h-full flex flex-col items-center justify-between shadow-none border-none p-0  rounded-none">
                <div className="w-full aspect-square relative">
                  <Image
                    src={cat.imageUrl || "/placeholder.svg"}
                    alt={cat.title}
                    fill
                    className="object-cover rounded-none"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority={false}
                  />
                </div>
                <CardContent className="w-full flex flex-col p-0">
                  <CardTitle className="text-base font-medium underline underline-offset-2">
                    {cat.title}
                  </CardTitle>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
      <ProductPagination page={page} pageCount={pageCount} baseUrl="/categories" />
    </div>
  );
}
