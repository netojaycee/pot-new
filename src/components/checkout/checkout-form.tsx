"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface CheckoutFormProps {
  clientSecret: string;
  orderId: string;
}

export function CheckoutForm({ clientSecret, orderId }: CheckoutFormProps) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
//   const { clearCart } = useCartStore();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Payment system not loaded");
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}`,
        },
        redirect: "if_required",
      });

      console.log("Payment result:", { error, paymentIntent });

      if (error) {
        toast.error(error.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent?.status === "succeeded") {
        // Payment succeeded immediately
        // Don't clear cart here - let confirmation page handle it or let webhook clear it
        toast.success("Payment successful! Redirecting...");
        router.push(`/order-confirmation?orderId=${orderId}`);
      } else if (paymentIntent?.status === "processing") {
        // Payment is processing (e.g., ACH transfer)
        toast.info(
          "Payment is processing. Please check your email for updates.",
        );
        router.push(`/order-confirmation?orderId=${orderId}`);
      } else {
        // For other statuses, redirect to confirmation page
        router.push(`/order-confirmation?orderId=${orderId}`);
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Details Section */}
      <div className="border">
        <div className="border bg-[#f5f5f5] p-2">
          <h2 className="text-lg font-semibold">Payment Details</h2>
          <p className="text-sm text-gray-600">Enter your card information</p>
        </div>
        <div className="p-4">
          <PaymentElement />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white text-base h-12 rounded-lg font-semibold flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <span>Pay Now</span>
            <span>→</span>
          </>
        )}
      </Button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        Your payment information is secure and encrypted by Stripe
      </p>
    </form>
  );
}
