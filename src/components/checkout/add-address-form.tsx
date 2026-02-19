"use client";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { addressSchema, type AddressInput } from "@/lib/schema/checkout.schema";
import { addAddressAction } from "@/lib/actions/user.actions";

interface AddAddressFormProps {
  onSuccess: (newAddress: any) => void;
  onCancel: () => void;
  isLoggedIn: boolean;
}

interface FormData extends AddressInput {
  isDefault?: boolean;
}

export function AddAddressForm({
  onSuccess,
  onCancel,
  isLoggedIn,
}: AddAddressFormProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      isDefault: false,
    },
  });

  async function onSubmit(data: FormData) {
    if (!isLoggedIn) {
      // For guests, just fill the form fields - don't save to DB
      // Parent component will use this as inline address
      onSuccess(data);
      return;
    }

    setIsPending(true);
    try {
      const result = await addAddressAction(data);

      if (!result.success) {
        toast.error(result.error || "Failed to add address");
        return;
      }

      toast.success("Address saved successfully!");
      onSuccess((result as any).data);
      form.reset();
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("An error occurred");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="p-6 animate-in fade-in slide-in-from-top-2">
      <h3 className="text-lg font-semibold mb-4">
        {isLoggedIn ? "Add New Address" : "Delivery Address"}
      </h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Street */}
          <FormField
            control={form.control}
            name="street"
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

          {/* City and State */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="New York"
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
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="NY"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ZIP and Country */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP/Postal Code *</FormLabel>
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

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
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
          </div>

          {/* Set as Default (only for logged-in) */}
          {isLoggedIn && (
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormLabel className="mt-0 cursor-pointer text-sm">
                    Set as default address
                  </FormLabel>
                </FormItem>
              )}
            />
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isLoggedIn ? "Save Address" : "Use This Address"
              )}
            </Button>
            {isLoggedIn && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </Card>
  );
}
