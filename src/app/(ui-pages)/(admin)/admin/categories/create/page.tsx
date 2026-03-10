"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryForm } from "@/components/admin/forms/CategoryForm";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

export default function CreateCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // TODO: Replace with getCategoriesAction()
        // const result = await getCategoriesAction();
        // if (result.success) {
        //   setCategories(result.data);
        // }
        setCategories([
          { id: "1", name: "Electronics" },
          { id: "2", name: "Clothing" },
        ]);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      // TODO: Call createCategoryAction(data)
      console.log("Creating category:", data);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/categories">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Category</h1>
          <p className="text-gray-600">Add a new product category</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
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
            <CategoryForm
              categories={categories}
              onSubmit={handleSubmit}
              isEditing={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
