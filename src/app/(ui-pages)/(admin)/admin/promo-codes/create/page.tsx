"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PromoCodeForm } from "@/components/admin/forms/PromoCodeForm";
import { toast } from "sonner";

export default function CreatePromoCodePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // TODO: Fetch any necessary promo code related data if needed
        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load data");
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      // TODO: Call createPromoCodeAction(data)
      console.log("Creating promo code:", data);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

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
          <h1 className="text-3xl font-bold">Create Promo Code</h1>
          <p className="text-gray-600">Add a new promotional discount code</p>
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
          ) : (
            <PromoCodeForm onSubmit={handleSubmit} isEditing={false} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
