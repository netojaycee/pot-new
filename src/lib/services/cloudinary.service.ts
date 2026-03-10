import cloudinary from "@/lib/cloudinary";

export type CloudinaryUploadResult = {
  pubId: string;
  secureUrl: string;
};

export type CloudinaryResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT = 30000; // 30 seconds

/**
 * Cloudinary service for image upload and deletion
 */
export const cloudinaryService = {
  /**
   * Upload image to Cloudinary
   */
  async uploadImage(
    imageFile: File,
    folder: string = "uploads",
  ): Promise<CloudinaryResult<CloudinaryUploadResult>> {
    try {
      // Validate file size
      if (imageFile.size > MAX_FILE_SIZE) {
        return {
          success: false,
          error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        };
      }

      // Convert File to Buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`[Cloudinary] Uploading file: ${imageFile.name}, size: ${imageFile.size} bytes`);

      // Upload to Cloudinary with timeout
      const result = await Promise.race([
        new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: "auto",
              timeout: 60000, // 60 second timeout
            },
            (error, result) => {
              if (error) {
                console.error("[Cloudinary] Upload error:", error);
                reject(error);
              } else {
                console.log("[Cloudinary] Upload success:", (result as any).public_id);
                resolve(result);
              }
            },
          );

          // Write buffer to stream and end
          stream.end(buffer);
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => {
              console.error("[Cloudinary] Upload timeout after 30 seconds");
              reject(new Error(`Upload timeout after ${UPLOAD_TIMEOUT}ms`));
            },
            UPLOAD_TIMEOUT,
          ),
        ),
      ]);

      return {
        success: true,
        data: {
          pubId: result.public_id,
          secureUrl: result.secure_url,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      console.error("[Cloudinary] Failed to upload image:", {
        message: errorMessage,
        fileSize: imageFile?.size,
        fileName: imageFile?.name,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Delete image from Cloudinary by public ID
   */
  async deleteImage(publicId: string): Promise<CloudinaryResult<void>> {
    try {
      await cloudinary.uploader.destroy(publicId);
      return { success: true, data: undefined };
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Delete failed",
      };
    }
  },

  /**
   * Upload image and delete old one (used for replacements)
   */
  async replaceImage(
    newImageFile: File,
    oldImagePubId: string | undefined,
    folder: string = "uploads",
  ): Promise<CloudinaryResult<CloudinaryUploadResult>> {
    // Upload new image first
    const uploadResult = await this.uploadImage(newImageFile, folder);

    if (!uploadResult.success) {
      return uploadResult;
    }

    // Delete old image if exists (non-blocking)
    if (oldImagePubId) {
      this.deleteImage(oldImagePubId).catch((error) => {
        console.error("Failed to delete old image:", error);
      });
    }

    return uploadResult;
  },
};
