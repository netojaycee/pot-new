"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { Heart } from "lucide-react";

type ProductGalleryProps = {
  images: Array<{ url: string; pubId?: string }> | string[];
};

export function ProductGallery({ images }: ProductGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize images to always be URLs
  const imageUrls = images.map((img) =>
    typeof img === "string" ? img : img.url,
  );

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap());
    };

    onSelect(); // initial
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Thumbnail click → scroll main carousel
  const handleThumbClick = (index: number) => {
    api?.scrollTo(index);
  };

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <span className="text-gray-400">No images available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-white">
      {/* MAIN IMAGE CAROUSEL */}
      <div className="relative">
        <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
          <CarouselContent>
            {imageUrls.map((src, i) => (
              <CarouselItem key={i}>
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={src}
                    alt={`Product image ${i + 1}`}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={i === 0}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Arrows */}
          {imageUrls.length > 1 && (
            <>
              <CarouselPrevious className="left-2 md:left-4" />
              <CarouselNext className="right-2 md:right-4" />
            </>
          )}

          {/* Carousel Dots */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full">
              <CarouselDots />
            </div>
          )}
        </Carousel>
      </div>

      {/* THUMBNAILS */}
      {/* {imageUrls.length > 1 && (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(5, imageUrls.length)}, minmax(0, 1fr))`,
          }}
        >
          {imageUrls.map((src, i) => (
            <button
              key={i}
              onClick={() => handleThumbClick(i)}
              className={`relative aspect-video rounded-md overflow-hidden border transition-all ${
                currentIndex === i
                  ? "border-primary ring-2 ring-primary ring-offset-1"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <Image
                src={src}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )} */}
    </div>
  );
}
