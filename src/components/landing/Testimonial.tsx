import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Quote } from "lucide-react";

interface TestimonialProps {
  quote: string;
  reviewerName: string;
  reviewerRole: string;
  tag: string;
  image: string;
  reviewerAvatar: string;
}

export default function Testimonial({
  quote,
  reviewerName,
  reviewerRole,
  tag,
  image,
  reviewerAvatar,
}: TestimonialProps) {
  return (
    <section className="py-4 bg-white px-4 lg:px-16">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-12 items-center">
        {/* Text Section - Left */}
        <div className="space-y-6">
          {/* Quote */}
          <blockquote className="space-y-4">
            <p className="text-lg text-gray-600 font-light leading-relaxed">
              <span className=" text-gray-400 mr-2 ">
                <Quote className="" />
              </span>
              {quote}
            </p>
          </blockquote>

          {/* Divider */}
          <hr className="border-t-2 border-gray-200" />

          {/* Reviewer Info */}
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 shrink-0">
              <AvatarImage src={reviewerAvatar} alt={reviewerName} />
              <AvatarFallback className="text-sm font-semibold">
                {reviewerName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-semibold text-gray-900">
                {reviewerName}
              </p>
              <p className="text-sm text-gray-600">{reviewerRole}</p>
            </div>
          </div>
        </div>

        {/* Image Section - Right */}
        <div className="relative w-full">
          <div className="relative h-56 md:h-64 rounded-lg overflow-hidden">
            <Image
              src={image}
              alt="Testimonial"
              fill
              className="object-cover"
            />

            {/* Badge */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-white text-gray-800 text-xs md:text-sm font-semibold px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-shadow">
                {tag}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
