"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Phone, Mail, MapPin, Gift } from "lucide-react";
import {
  checkoutFormSchema,
  type CheckoutFormInput,
} from "@/lib/schema/checkout.schema";
import { useCheckoutData } from "@/lib/hooks/use-checkout";
import { checkoutAction } from "@/lib/actions/order.actions";
import { getProfileAction } from "@/lib/actions/user.actions";
import { getSession } from "@/lib/auth";

interface RecipientAndAddressFormProps {
  onOrderCreated: (orderId: string, clientSecret: string, order?: any) => void;
}

type FormData = CheckoutFormInput;

const OCCASIONS = [
  { value: "", label: "Select an occasion (optional)" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "wedding", label: "Wedding" },
  { value: "graduation", label: "Graduation" },
  { value: "congratulations", label: "Congratulations" },
  { value: "thank-you", label: "Thank You" },
  { value: "get-well", label: "Get Well" },
  { value: "sympathy", label: "Sympathy" },
  { value: "other", label: "Other" },
];

export function RecipientAndAddressForm({
  onOrderCreated,
}: RecipientAndAddressFormProps) {
  const checkoutData = useCheckoutData();
  const [isPending, setIsPending] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(checkoutFormSchema) as any,
    mode: "onChange",
    defaultValues: {
      email: checkoutData.email || "",
      firstName: checkoutData.firstName || "",
      lastName: checkoutData.lastName || "",
      phone: "",
      deliveryAddress: {
        street: "",
        town: "",
        zip: "",
        county: "",
      },
      occasion: "",
      specialMessage: "",
    },
  });

  // Fetch user profile if logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      setProfileLoading(true);
      try {
        // Check if user is logged in by calling getProfileAction
        const profileResult = await getProfileAction();
        
        if (profileResult.success && "data" in profileResult && profileResult.data) {
          const userData = profileResult.data;
          setIsLoggedIn(true);
          
          // Pre-fill form with user data
          form.reset({
            email: userData.email || "",
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            phone: userData.phone || "",
            deliveryAddress: {
              street: "",
              town: "",
              zip: "",
              county: "",
            },
            occasion: "",
            specialMessage: "",
          });
          
          // Store phone for conditional disable logic
          if (userData.phone) {
            setUserPhone(userData.phone);
          }
        } else {
          // Not logged in or profile fetch failed
          setIsLoggedIn(false);
        }
      } catch (error) {
        // Not logged in
        setIsLoggedIn(false);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [form]);

  async function onSubmit(data: FormData) {
    setIsPending(true);
    console.log(data)
    try {
        // console.log(data)
        const payload = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        deliveryAddress: data.deliveryAddress,
        occasion: data.occasion || undefined,
        specialMessage: data.specialMessage || undefined,
      }
      // Call server action to create order
      const result = await checkoutAction(payload);


      if (!result.success) {
        toast.error(result.error || "Failed to create order");
        setIsPending(false);
        return;
      }

      // Order created successfully
      toast.success("Order created! Proceeding to payment...");
      if (result.data) {
        onOrderCreated(result.data.orderId, result.data.clientSecret, result.data.order);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred during checkout");
    } finally {
      setIsPending(false);
    }
  }

  // Loading state
  if (checkoutData.loading || profileLoading) {
    return (
      <div className="border bg-[#f5f5f5]">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </CardContent>
      </div>
    );
  }

  // Error state
  if (checkoutData.error) {
    return (
      <div className="border bg-[#f5f5f5]">
        <CardContent className="py-8">
          <p className="text-red-600">{checkoutData.error}</p>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ============ RECIPIENT INFORMATION ============ */}
          <div className="border">
            <div className="border bg-[#f5f5f5] p-2">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Recipient Information
              </CardTitle>
            </div>
            <div className="space-y-4 p-4">
              {/* Email field - disabled for logged-in users */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        {...field}
                        disabled={isLoggedIn || isPending}
                        className="disabled:bg-gray-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* First and Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          {...field}
                          disabled={isLoggedIn || isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          {...field}
                          disabled={isLoggedIn || isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Phone (Optional) */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number {isLoggedIn && userPhone ? "(from profile)" : "(Optional)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        {...field}
                        disabled={isLoggedIn && !!userPhone || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ============ DELIVERY ADDRESS ============ */}
          <div className="border">
            <div className="border bg-[#f5f5f5] p-2">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </div>
            <div className="space-y-4 p-4">
              {/* Street Address */}
              <FormField
                control={form.control}
                name="deliveryAddress.county"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>County *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Main Street"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

             

              <div className="grid grid-cols-2 gap-4">
             

                <FormField
                  control={form.control}
                  name="deliveryAddress.town"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Town/City *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="United States"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                   <FormField
                  control={form.control}
                  name="deliveryAddress.zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Code *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="10001"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               {/* Street Address */}
              <FormField
                control={form.control}
                name="deliveryAddress.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Main Street"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ============ GIFT OPTIONS (OPTIONAL) ============ */}
          <div className="border">
            <div className="border bg-[#f5f5f5] p-2">
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Gift Options (Optional)
              </CardTitle>
            </div>
            <div className="space-y-4 p-4">
              {/* Occasion Dropdown */}
              <FormField
                control={form.control}
                name="occasion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occasion</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        disabled={isPending}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                      >
                        {OCCASIONS.map((occasion) => (
                          <option key={occasion.value} value={occasion.value}>
                            {occasion.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Special Message Textarea */}
              <FormField
                control={form.control}
                name="specialMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Message</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Add a personal message (optional)"
                        {...field}
                        disabled={isPending}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white text-base h-12 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <span>Proceed to Payment</span>
                <span>→</span>
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
