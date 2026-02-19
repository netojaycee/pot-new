"use client";

import { useEffect, useState } from "react";
import { useSessionStore } from "@/stores/session.store";
import { getAddressesAction, getProfileAction } from "@/lib/actions/user.actions";

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface CheckoutData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  addresses: Address[];
  defaultAddressId?: string;
  loading: boolean;
  error?: string;
}

/**
 * Hook to fetch user profile and addresses for checkout form
 * Returns user data and saved addresses (if logged-in)
 */
export function useCheckoutData(): CheckoutData {
  const { session } = useSessionStore();
  const [data, setData] = useState<CheckoutData>({
    addresses: [],
    loading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData((prev) => ({ ...prev, loading: true }));

        // If logged-in, fetch profile and addresses
        if (session && "userId" in session) {
          const [profileRes, addressesRes] = await Promise.all([
            getProfileAction(),
            getAddressesAction(),
          ]);

          if (profileRes.success && addressesRes.success) {
            const profile = (profileRes as any).data;
            const addresses = ((addressesRes as any).data || []) as Address[];
            const defaultAddress = addresses.find((a) => a.isDefault);

            setData({
              userId: session.userId,
              email: profile.email,
              firstName: profile.firstName,
              lastName: profile.lastName,
              addresses,
              defaultAddressId: defaultAddress?.id,
              loading: false,
            });
          } else {
            setData((prev) => ({
              ...prev,
              error: "Failed to load profile or addresses",
              loading: false,
            }));
          }
        } else {
          // Guest user - no addresses to fetch
          setData((prev) => ({
            ...prev,
            addresses: [],
            loading: false,
          }));
        }
      } catch (error) {
        console.error("Error fetching checkout data:", error);
        setData((prev) => ({
          ...prev,
          error: "An error occurred while loading data",
          loading: false,
        }));
      }
    };

    fetchData();
  }, [session]);

  return data;
}
