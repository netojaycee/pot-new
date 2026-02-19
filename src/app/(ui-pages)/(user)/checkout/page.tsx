"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart.store";
import { OrderSummary } from "@/components/checkout/order-summary";
import { RecipientAndAddressForm } from "@/components/checkout/recipient-and-address-form";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
    const router = useRouter();
    const { items } = useCartStore();
    
    // State for checkout flow
    const [step, setStep] = useState<"recipient" | "payment">("recipient");
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [order, setOrder] = useState<any>(null);
    const [isLoadingStripe, setIsLoadingStripe] = useState(true);

    // Route guard: Check if cart has items on initial load only
    useEffect(() => {
        if (items.length === 0 && step === "recipient") {
            // Redirect back to cart only if still on recipient step
            router.push("/cart");
        }
    }, [items.length, step, router]);

    // Show loading if no items
    if (items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleOrderCreated = (newOrderId: string, newClientSecret: string, orderData?: any) => {
        setOrderId(newOrderId);
        setClientSecret(newClientSecret);
        setOrder(orderData);
        setStep("payment");
        setIsLoadingStripe(false);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    {step === "recipient" ? (
                        <RecipientAndAddressForm onOrderCreated={handleOrderCreated} />
                    ) : (
                        <>
                            {isLoadingStripe || !clientSecret || !orderId ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <Elements
                                    stripe={stripePromise}
                                    options={{
                                        clientSecret,
                                        appearance: {
                                            theme: "stripe",
                                        },
                                    }}
                                >
                                    <CheckoutForm clientSecret={clientSecret} orderId={orderId} />
                                </Elements>
                            )}
                        </>
                    )}
                </div>

                {/* Order Summary (sticky on desktop) */}
                <div className="lg:sticky lg:top-8 h-fit">
                    <OrderSummary order={step === "payment" ? order : undefined} />
                </div>
            </div>
        </div>
    );
}
