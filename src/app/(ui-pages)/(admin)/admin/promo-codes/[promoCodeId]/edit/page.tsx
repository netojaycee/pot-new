"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PromoCodeForm } from "@/components/admin/forms/PromoCodeForm";
import { getPromoCodeAction } from "@/lib/actions/promo-code.actions";
import { toast } from "sonner";

interface PromoCode {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder?: number;
  maxUses?: number;
  expiryDate?: string;
  active: boolean;
}

interface FormData {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder?: number;
  maxUses?: number;
  expiryDate?: string;
  active: boolean;
}

export default function EditPromoCodePage() {
  const params = useParams();
  const promoCodeId = params?.promoCodeId as string;
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromoCode = async () => {
      try {
        setLoading(true);
        
        const result = await getPromoCodeAction(promoCodeId);
        if (result.success) {
          // Transform the data to match form expectations
          const formattedData = {
            ...result.data,
            expiryDate: result.data.expiry 
              ? new Date(result.data.expiry).toISOString().split('T')[0]
              : undefined,
          };
          setPromoCode(formattedData);
        } else {
          toast.error(result.error || "Failed to load promo code");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load promo code");
      } finally {
        setLoading(false);
      }
    };

    if (promoCodeId) {
      fetchPromoCode();
    }
  }, [promoCodeId]);

  const handleSubmit = async (data: FormData) => {
    try {
      // TODO: Call updatePromoCodeAction(promoCodeId, data)
      console.log("Updating promo code:", promoCodeId, data);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  if (!promoCodeId) return <div>Invalid promo code ID</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/promo-codes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Promo Code</h1>
          <p className="text-gray-600">Update promo code details</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Promo Code Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : promoCode ? (
            <PromoCodeForm
              onSubmit={handleSubmit}
              isEditing={true}
              initialData={promoCode}
            />
          ) : (
            <div>Promo code not found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
