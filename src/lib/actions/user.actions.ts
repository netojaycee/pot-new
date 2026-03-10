"use server";

import { getSession } from "@/lib/auth";
import {
  userService,
  UpdateProfileInput,
  ChangePasswordInput,
} from "@/lib/services/user.service";

import { revalidatePath } from "next/cache";
import { changePasswordSchema, updateProfileSchema } from "../schema";

// ============ AUTHENTICATED READ ACTIONS ============

/**
 * Get current user profile
 */
export async function getProfileAction() {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    return await userService.getProfile(session.userId);
  } catch (error) {
    console.error("Get profile action error:", error);
    return {
      success: false,
      error: "Failed to fetch profile",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get user addresses
 */
export async function getAddressesAction() {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const addresses = await userService.getAddresses(session.userId);
    return { success: true, data: addresses };
  } catch (error) {
    console.error("Get addresses action error:", error);
    return {
      success: false,
      error: "Failed to fetch addresses",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get user orders
 */
export async function getOrdersAction(limit = 10, offset = 0) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const orders = await userService.getOrders(session.userId, limit, offset);
    return { success: true, data: orders };
  } catch (error) {
    console.error("Get orders action error:", error);
    return {
      success: false,
      error: "Failed to fetch orders",
      code: "FETCH_ERROR",
    };
  }
}

// ============ WRITE ACTIONS ============

/**
 * Update user profile
 */
// export async function updateProfileAction(input: UpdateProfileInput) {
//   try {
//     const session = await getSession();
//     if (!session || !("userId" in session)) {
//       return {
//         success: false,
//         error: "Unauthorized",
//         code: "UNAUTHORIZED",
//       };
//     }

//     const validated = updateProfileSchema.safeParse(input);
//     if (!validated.success) {
//       return {
//         success: false,
//         error: validated.error.issues[0].message,
//         code: "VALIDATION_ERROR",
//       };
//     }

//     const result = await userService.updateProfile(session.userId, validated.data);

//     if (result.success) {
//       revalidatePath("/account");
//     }

//     return result;
//   } catch (error) {
//     console.error("Update profile action error:", error);
//     return {
//       success: false,
//       error: "Failed to update profile",
//       code: "UPDATE_ERROR",
//     };
//   }
// }

export async function updateProfileAction(
  input: FormData | UpdateProfileInput,
) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    // Handle FormData from client
    let profileData: UpdateProfileInput;
    let imageFile: File | undefined;
    let oldImagePubId: string | undefined;

    if (input instanceof FormData) {
      profileData = {
        firstName: input.get("firstName") as string,
        lastName: input.get("lastName") as string,
        phone: (input.get("phone") as string) || undefined,
      };
      imageFile = (input.get("image") as File) || undefined;
      oldImagePubId = (input.get("oldImagePubId") as string) || undefined;
    } else {
      profileData = input;
    }

    const validated = updateProfileSchema.safeParse(profileData);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    const result = await userService.updateProfile(
      session.userId,
      validated.data,
      imageFile,
      oldImagePubId,
    );

    if (result.success) {
      revalidatePath("/account-management/profile");
    }

    return result;
  } catch (error) {
    console.error("Update profile action error:", error);
    return {
      success: false,
      error: "Failed to update profile",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Change password
 */
export async function changePasswordAction(input: ChangePasswordInput) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const validated = changePasswordSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    return await userService.changePassword(session.userId, validated.data);
  } catch (error) {
    console.error("Change password action error:", error);
    return {
      success: false,
      error: "Failed to change password",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Add address
 */
export async function addAddressAction(data: {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const result = await userService.addAddress(session.userId, data);

    if (result.success) {
      revalidatePath("/account/addresses");
    }

    return result;
  } catch (error) {
    console.error("Add address action error:", error);
    return {
      success: false,
      error: "Failed to add address",
      code: "CREATE_ERROR",
    };
  }
}

/**
 * Update address
 */
export async function updateAddressAction(
  addressId: string,
  data: Partial<{
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault: boolean;
  }>,
) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    if (!addressId || addressId.trim() === "") {
      return {
        success: false,
        error: "Address ID required",
        code: "INVALID_ID",
      };
    }

    const result = await userService.updateAddress(
      session.userId,
      addressId,
      data,
    );

    if (result.success) {
      revalidatePath("/account/addresses");
    }

    return result;
  } catch (error) {
    console.error("Update address action error:", error);
    return {
      success: false,
      error: "Failed to update address",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Delete address
 */
export async function deleteAddressAction(addressId: string) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    if (!addressId || addressId.trim() === "") {
      return {
        success: false,
        error: "Address ID required",
        code: "INVALID_ID",
      };
    }

    const result = await userService.deleteAddress(session.userId, addressId);

    if (result.success) {
      revalidatePath("/account/addresses");
    }

    return result;
  } catch (error) {
    console.error("Delete address action error:", error);
    return {
      success: false,
      error: "Failed to delete address",
      code: "DELETE_ERROR",
    };
  }
}
interface GetAllCustomersParams {
  limit: number;
  offset: number;
  search: string;
}

/**
 * Get all customers
 */
export async function getAllCustomersAction(
  limit: number,
  offset: number,
  search: string,
): Promise<any> {
  try {
    // const session = await getSession();
    // if (!session || !("userId" in session)) {
    //   return {
    //     success: false,
    //     error: "Unauthorized",
    //     code: "UNAUTHORIZED",
    //   };
    // }

    return await userService.getAllCustomers(limit, offset, search);
  } catch (error) {
    console.error("Get all customers action error:", error);
    return {
      success: false,
      error: "Failed to fetch customers",
      code: "FETCH_ERROR",
    };
  }
}
