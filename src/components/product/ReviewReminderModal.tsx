"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getUnreviewedProductsAction } from "@/lib/actions/review.actions";

const DISMISS_KEY = "pot_review_remind_dismissed";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UnreviewedItem {
  product: {
    id: string;
    name: string;
    images: Array<{ url: string }>;
    slug: string;
    type: string;
  };
  orderNumber: string;
  orderId: string;
  orderStatus: string;
}

export function ReviewReminderModal() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UnreviewedItem[]>([]);

  useEffect(() => {
    const last = localStorage.getItem(DISMISS_KEY);
    if (last && Date.now() - Number(last) < COOLDOWN_MS) return;

    getUnreviewedProductsAction().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setItems(res.data);
        // Small delay so it doesn't pop up immediately on page load
        setTimeout(() => setOpen(true), 2500);
      }
    });
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  }

  if (items.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            Share your experience!
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-1">
          You&apos;ve ordered {items.length === 1 ? "a product" : `${items.length} products`} that you haven&apos;t reviewed yet. Your feedback helps others find the perfect gift.
        </p>

        <div className="space-y-3 mt-2 max-h-60 overflow-y-auto pr-1">
          {items.map(({ product, orderNumber }) => {
            const imgUrl = (product.images as any[])?.[0]?.url;
            return (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                {imgUrl ? (
                  <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-gray-100">
                    <Image
                      src={imgUrl}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-primary/10 shrink-0 flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">Order #{orderNumber}</p>
                </div>
                <Button asChild size="sm" variant="outline" onClick={dismiss} className="shrink-0">
                  <Link href={`/products/${product.type}/${product.slug}#reviews`}>
                    Review
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={dismiss} className="flex-1 text-muted-foreground">
            Remind me later
          </Button>
          <Button
            size="sm"
            onClick={dismiss}
            className="flex-1"
            asChild
          >
            <Link href={`/products/${items[0].product.type}/${items[0].product.slug}#reviews`}>
              Leave a review
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
