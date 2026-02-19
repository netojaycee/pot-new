"use client";

import { Star, ChevronRight, User2, UserCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Review {
  rating: number;
  name: string;
  date: string;
  comment: string;
}

interface ReviewsSectionProps {
  averageRating: number;
  reviewCount: number;
  reviews: Review[];
}

export function ReviewsSection({
  averageRating,
  reviewCount,
  reviews,
}: ReviewsSectionProps) {
  // Show first 2 reviews, rest in dialog
  const previewReviews = reviews.slice(0, 1);
  const hasMoreReviews = reviews.length > 1;

  return (
    <div className="mt-8 border-t pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={
                    i < Math.floor(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }
                />
              ))}
            </div>
            <span className="text-lg font-semibold text-gray-900">
              {averageRating.toFixed(1)} out of 5 ({reviewCount} reviews)
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-600">
            All reviews are from verified buyers
          </p>
        </div>

        {/* View All Reviews Dialog Trigger */}
        {hasMoreReviews && (
          <Dialog>
            <DialogTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] ">
              <DialogHeader className="border-b mb-1">
                <DialogTitle className="sr-only">All Reviews</DialogTitle>
                <DialogDescription>
                  <div className="">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-0.5">
                        <Star
                          size={18}
                          className={"fill-yellow-400 text-yellow-400"}
                        />
                      </div>
                      <span className="text-base font-medium text-gray-900">
                        {averageRating.toFixed(1)} out of 5 ({reviewCount}{" "}
                        reviews)
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600">
                      All reviews are from verified buyers
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-3">
                  {reviews.map((review, idx) => (
                    <div key={idx} className="pb-3 border-b last:border-b-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          {/* Stars */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }
                                />
                              ))}
                            </div>
                          </div>

                          {/* Review Comment */}
                          <p className="text-sm text-gray-700 mb-1 leading-relaxed">
                            {review.comment}
                          </p>

                          {/* Reviewer Info */}
                          <p className="text-xs text-gray-600 font-semibold">
                            <UserCircle2 className="w-4 h-4 inline-block mr-1" />{" "}
                            {review.name}{" "}
                            <span className="font-normal">• {review.date}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Preview Reviews (First 2) */}
      <div className="space-y-4">
        {previewReviews.map((review, idx) => (
          <div key={idx} className="pb-4 border-b">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {/* Stars */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <p className="text-sm text-gray-700 mb-2">{review.comment}</p>

                {/* Reviewer Name and Date */}
                <p className="text-xs text-gray-600 font-semibold">
                  {review.name}{" "}
                  <span className="font-normal">• {review.date}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
