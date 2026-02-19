"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isProductInWishlist,
  getWishlistCount,
  clearWishlist,
  AddToWishlistInput,
} from "@/lib/services/wishlist.service";

// ============ WISHLIST ACTIONS ============

export async function getWishlistAction() {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  return await getWishlist(session.userId);
}

export async function addToWishlistAction(input: AddToWishlistInput) {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  const result = await addToWishlist(session.userId, input);
  if (result.success) {
    revalidatePath("/wishlist");
  }
  return result;
}

export async function removeFromWishlistAction(productId: string) {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  const result = await removeFromWishlist(session.userId, productId);
  if (result.success) {
    revalidatePath("/wishlist");
  }
  return result;
}

export async function isProductInWishlistAction(productId: string) {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return { success: true, data: false };
  }

  return await isProductInWishlist(session.userId, productId);
}

export async function getWishlistCountAction() {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return { success: true, data: 0 };
  }

  return await getWishlistCount(session.userId);
}

export async function clearWishlistAction() {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  const result = await clearWishlist(session.userId);
  if (result.success) {
    revalidatePath("/wishlist");
  }
  return result;
}
