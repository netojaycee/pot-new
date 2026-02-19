"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  createReturn,
  getReturn,
  getUserReturns,
  approveReturn,
  rejectReturn,
  processRefund,
  CreateReturnInput,
} from "@/lib/services/refund.service";

// ============ REFUND/RETURN ACTIONS ============

export async function createReturnAction(input: CreateReturnInput) {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  const result = await createReturn(session.userId, input);
  if (result.success) {
    revalidatePath("/orders");
    revalidatePath("/returns");
  }
  return result;
}

export async function getReturnAction(returnId: string) {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  return await getReturn(returnId, session.userId);
}

export async function getUserReturnsAction(limit?: number, offset?: number) {
  const session = await getSession();

  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  return await getUserReturns(session.userId, limit, offset);
}

// ============ ADMIN RETURN ACTIONS ============

export async function approveReturnAction(returnId: string) {
  const session = await getSession();

  // TODO: Verify user is admin
  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  const result = await approveReturn(returnId);
  if (result.success) {
    revalidatePath("/admin/returns");
  }
  return result;
}

export async function rejectReturnAction(
  returnId: string,
  rejectionReason: string
) {
  const session = await getSession();

  // TODO: Verify user is admin
  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  const result = await rejectReturn(returnId, rejectionReason);
  if (result.success) {
    revalidatePath("/admin/returns");
  }
  return result;
}

export async function processRefundAction(
  returnId: string,
  stripeRefundId?: string
) {
  const session = await getSession();

  // TODO: Verify user is admin
  if (!session || !("userId" in session)) {
    return {
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    };
  }

  const result = await processRefund(returnId, stripeRefundId);
  if (result.success) {
    revalidatePath("/admin/returns");
  }
  return result;
}
