"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Phone, User, Mail, Loader2, Settings, UserRoundPen } from "lucide-react";
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
import { toast } from "sonner";
import { updateProfileSchema } from "@/lib/schema";
import {
  getProfileAction,
  updateProfileAction,
} from "@/lib/actions/user.actions";
import Image from "next/image";

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export default function ProfilePage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [initials, setInitials] = useState("SE");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [currentImageData, setCurrentImageData] = useState<{
    pubId: string;
    secureUrl: string;
  } | null>(null);

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  // Fetch initial user data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await getProfileAction();
        if (result.success) {
          const userData = (result as any)?.data;
          form.reset({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            phone: userData.phone || "",
          });

          // Set email
          setEmail(userData.email || "");

          // Set current image if exists
          if (userData.image?.secureUrl) {
            setCurrentImageData(userData.image);
          }

          // Set initials from first and last name
          const firstInitial = userData.firstName?.charAt(0) || "";
          const lastInitial = userData.lastName?.charAt(0) || "";
          setInitials((firstInitial + lastInitial).toUpperCase() || "SE");
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [form]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 5MB limit");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Store the actual file
      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: UpdateProfileFormData) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("firstName", values.firstName);
        formData.append("lastName", values.lastName);
        if (values.phone) {
          formData.append("phone", values.phone);
        }

        // Add image file if one was selected
        if (photoFile) {
          formData.append("image", photoFile);
          // Include old image data for deletion
          if (currentImageData) {
            formData.append("oldImagePubId", currentImageData.pubId);
          }
        }

        const result = await updateProfileAction(formData);

        if (!result.success) {
          console.log("Update failed:", result);
          toast.error(result.error || "Failed to update profile");
          return;
        }

        toast.success("Profile updated successfully!");

        // Update initials
        const firstInitial = values.firstName?.charAt(0) || "";
        const lastInitial = values.lastName?.charAt(0) || "";
        setInitials((firstInitial + lastInitial).toUpperCase() || "SE");

        // Reset photo state after successful upload
        setPhotoFile(null);
        setPhotoPreview(null);

        // Update current image if a new one was uploaded
        if (result.data?.image?.secureUrl) {
          setCurrentImageData(result.data.image);
        }
      } catch (error) {
        console.error("Update error:", error);
        toast.error("An error occurred while updating profile");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
       <div className="flex items-center gap-2 p-2 bg-[#FAFAFA] border border-gray-200">
          <UserRoundPen className="w-4 h-4 text-gray-600 shrink-0" />
          <h2 className="text-sm font-semibold text-gray-900 uppercase">Edit Profile</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      
       <div className="flex items-center gap-2 p-2 bg-[#FAFAFA] border border-gray-200">
          <UserRoundPen className="w-4 h-4 text-gray-600 shrink-0" />
          <h2 className="text-sm font-semibold text-gray-900 uppercase">Edit Profile</h2>
        </div>
    <div className="space-y-4 p-4 md:p-6">

      {/* Profile Photo */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
            {photoPreview ? (
              <Image
                width={96}
                height={96}
                src={photoPreview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : currentImageData?.secureUrl ? (
              <Image
                width={96}
                height={96}
                src={currentImageData.secureUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-4xl font-bold text-white">{initials}</div>
            )}
          </div>
          <label htmlFor="photo-upload" className="absolute bottom-0 right-0">
            <div className="bg-white border-2 border-gray-200 rounded-full p-2 cursor-pointer hover:border-blue-500 transition shadow-md">
              <Upload className="w-4 h-4 text-gray-700" />
            </div>
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            hidden
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
        {photoPreview && (
          <button
            onClick={() => {
              setPhotoFile(null);
              setPhotoPreview(null);
            }}
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            Remove photo
          </button>
        )}
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* First Name and Last Name - Flex on desktop, Col on mobile */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* First Name */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-gray-700">First Name</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="Samuel"
                        {...field}
                        disabled={isPending}
                        className="pl-10 border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </FormControl>
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last Name */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-gray-700">Last Name</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="Edeh"
                        {...field}
                        disabled={isPending}
                        className="pl-10 border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </FormControl>
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email - Disabled */}
          <div>
            <FormLabel className="text-gray-700">Email Address</FormLabel>
            <div className="relative">
              <Input
                type="email"
                disabled
                value={email}
                className="pl-10 bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
              />
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Email cannot be changed
            </p>
          </div>

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Phone Number</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="1234 567890"
                      {...field}
                      disabled={isPending}
                      className="pl-10 border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </FormControl>
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {/* <p className="text-xs text-gray-500 mt-2">Optional</p> */}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => form.reset()}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
    </div>
  );
}
