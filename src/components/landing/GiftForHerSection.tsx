import Image from "next/image";
import { Button } from "../ui/button";

export function GiftForHerSection() {
  return (
    <section className="relative w-full h-80 md:h-96 overflow-hidden">
      {/* Background Image */}
      <Image
        src="/gift.png"
        alt="Find the Perfect Gift for Her"
        fill
        className="object-cover object-top"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-end px-6 md:px-12">
        <div className="md:max-w-lg space-y-6">
          <h2 className="text-2xl md:text-4xl font-semibold text-[#ffffff]">
            Find the Perfect
            <br />
            Gift for Her
          </h2>

          <Button className="border border-primary bg-transparent text-primary px-8 py-3 rounded-lg hover:bg-primary hover:text-white transition font-semibold w-fit">
            Shop Now
          </Button>
        </div>
      </div>
    </section>
  );
}
