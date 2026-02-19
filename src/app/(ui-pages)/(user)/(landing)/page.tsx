import { ProductList } from "@/components/product/ProductList";
import { HeroSection } from "@/components/landing/HeroSection";
import { BestSellingSection } from "@/components/landing/BestSellingSection";
import { testimonial } from "@/lib/constants";
import Testimonial from "@/components/landing/Testimonial";
import { GiftForHerSection } from "@/components/landing/GiftForHerSection";
import { EssentialsSection } from "@/components/landing/EssentialsSection";
import { InspirationSection } from "@/components/landing/InspirationSection";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <HeroSection />

      {/* Best Selling Section */}
      <BestSellingSection />

      {/* Testimonial Section */}
      <Testimonial
        quote={testimonial.quote}
        reviewerName={testimonial.reviewerName}
        reviewerRole={testimonial.reviewerRole}
        tag={testimonial.tag}
        image={testimonial.image}
        reviewerAvatar={testimonial.reviewerAvatar}
      />

      {/* Gift for Her Section */}
      <GiftForHerSection />

      {/* Essentials Section */}
      <EssentialsSection />

      {/* Inspiration Section */}
      <InspirationSection />
    </div>
  );
}
