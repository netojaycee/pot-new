import { z } from "zod";

// ============ ADDRESS SCHEMA ============
export const addressSchema = z.object({
  street: z.string().min(1, "Street address required"),
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  zip: z.string().min(1, "ZIP code required"),
  country: z.string().min(1, "Country required"),
});

export const addAddressSchema = z.object({
  street: z.string().min(1, "Street address required"),
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  zip: z.string().min(1, "ZIP code required"),
  country: z.string().min(1, "Country required"),
  isDefault: z.boolean().default(false),
});

// ============ CHECKOUT FORM SCHEMA ============
// For logged-in users: email is pre-filled and disabled
// For guests: email is required and editable
export const checkoutFormSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First name required"),
    lastName: z.string().min(1, "Last name required"),
    phone: z.string().optional().or(z.literal("")),

    // Address: always use inline delivery address
    deliveryAddress: addressSchema,

    // Gift options (optional)
    occasion: z.string().optional().or(z.literal("")),
    specialMessage: z.string().optional().or(z.literal("")),
  });

// ============ TYPE EXPORTS ============
export type AddressInput = z.infer<typeof addressSchema>;
export type AddAddressInput = z.infer<typeof addAddressSchema>;
export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;
