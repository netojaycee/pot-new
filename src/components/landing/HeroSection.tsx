"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const slides = [
  {
    image: "/hero1.png",
    heading: "Deliver Joy, Unbox Memories",
    subheading:
      "Curated gifts for every occasion — birthdays, anniversaries, or just because.",
    buttonText: "Shop Gifts",
    buttonLink: "/products",
  },
  {
    image: "/hero2.png",
    heading: "Celebrate Every Moment",
    subheading:
      "Thoughtful gift boxes for weddings, graduations, and special milestones.",
    buttonText: "Explore Gifts",
    buttonLink: "/products",
  },
];

const advertItems = [
  "🎁 Free delivery on orders over £50",
  "✨ Thoughtfully curated gift boxes",
  "🚀 Same-day dispatch available",
  "💛 Trusted by thousands across the UK",
  "🎀 Personalised gift messages included",
  "⭐ 5-star rated gifts for every budget",
];

const AUTOPLAY_DELAY = 5000;

export function HeroSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const startAutoplay = useCallback(() => {
    clearAutoplay();
    intervalRef.current = setInterval(() => {
      api?.scrollNext();
    }, AUTOPLAY_DELAY);
  }, [api, clearAutoplay]);

  useEffect(() => {
    if (!api) return;

    const updateIndex = () => setActiveIndex(api.selectedScrollSnap());
    updateIndex();
    api.on("select", updateIndex);
    api.on("pointerDown", clearAutoplay);
    api.on("pointerUp", startAutoplay);

    startAutoplay();

    return () => {
      clearAutoplay();
      api.off("select", updateIndex);
      api.off("pointerDown", clearAutoplay);
      api.off("pointerUp", startAutoplay);
    };
  }, [api, startAutoplay, clearAutoplay]);

  return (
    <section aria-label="Hero">
      {/* Carousel */}
      <div className="relative">
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "start" }}
          className="w-full"
        >
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="relative h-[55vw] min-h-64 max-h-[85vh] w-full overflow-hidden">
                  <Image
                    src={slide.image}
                    alt={slide.heading}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-0 flex items-center px-6 md:px-16">
                    <div
                      className={cn(
                        "max-w-xl text-white transition-all duration-700",
                        activeIndex === index
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-5 pointer-events-none",
                      )}
                    >
                      <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                        {slide.heading}
                      </h1>
                      <p className="text-base md:text-xl text-gray-200 mb-6 leading-relaxed">
                        {slide.subheading}
                      </p>
                      <Button asChild size="lg">
                        <Link href={slide.buttonLink}>{slide.buttonText}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Dot indicators */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10"
          aria-label="Slide indicators"
        >
          {slides.map((slide, index) => (
            <button
              key={index}
              aria-label={`Go to slide ${index + 1}: ${slide.heading}`}
              onClick={() => {
                api?.scrollTo(index);
                startAutoplay();
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300 bg-white",
                activeIndex === index ? "w-6 opacity-100" : "w-2 opacity-50",
              )}
            />
          ))}
        </div>
      </div>

      {/* Yellow advert scrolling strip */}
      <div className="bg-yellow-400 text-black py-2 overflow-hidden select-none">
        <div className="flex animate-marquee whitespace-nowrap w-max">
          {[...advertItems, ...advertItems].map((item, i) => (
            <span key={i} className="mx-10 text-sm font-semibold">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
