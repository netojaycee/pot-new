"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/hooks/use-cart";

export default function Cart() {
  const { items: cart } = useCart();
  const cartCount = cart?.length || 0;

  return (
    <Link href='/cart' className='relative cursor-pointer transition-all hover:text-primary duration-300 hover:scale-110 shrink-0'>
      <ShoppingCart className='w-6 h-6' />
      {cartCount > 0 && (
        <span className='absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'>
          {cartCount}
        </span>
      )}
    </Link>
  );
}

