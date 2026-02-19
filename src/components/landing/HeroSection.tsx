import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className=" h-auto px-4 lg:px-16 py-4">
      <div className="w-full ">
        {/* Mobile Col / MD+ Row Layout */}
        <div className="flex flex-col md:flex-row items-center gap-5 md:gap-12">
          {/* Image: Full width on mobile, flex-1 on md+ */}
          <div className="w-full md:flex-1 relative h-80 sm:h-96 md:h-auto md:min-h-96">
            <Image
              src="/hero.png"
              alt="Woman holding red polka dot gift box"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Content: Text center on mobile, left-aligned on md+ */}
          <div className="w-full md:flex-1 space-y-3 md:space-y-6 text-left">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight">
              Make Someone&apos;s Day in Minutes
            </h1>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              Choose from ready-made gift packages and send a personalized
              surprise without doing any of the work.
            </p>
            <div className="flex justify-start">
              <Button asChild>
                <Link
                  href="/products?type=giftbox"
                  className="w-1/2"
                >
                  Shop Gifts
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
