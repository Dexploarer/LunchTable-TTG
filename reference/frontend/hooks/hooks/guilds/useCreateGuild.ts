"use client";

import { typedApi } from "@/lib/convexHelpers";
import { handleHookError } from "@/lib/errorHandling";
import type { Visibility } from "@/types/common";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

// Module-scope references to avoid TS2589
const createGuildMutationRef = typedApi.social.guilds.core.createGuild;
const setProfileImageMutationRef = typedApi.social.guilds.core.setProfileImage;
const setBannerImageMutationRef = typedApi.social.guilds.core.setBannerImage;
const generateUploadUrlMutationRef = typedApi.storage.images.generateUploadUrl;

interface CreateGuildData {
  name: string;
  description?: string;
  visibility: Visibility;
}

/**
 * Hook for creating a new guild with image uploads
 */
export function useCreateGuild() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mutations (not using toast wrapper since we handle success/error in createGuild)
  const createGuildMutation = useMutation(createGuildMutationRef);
  const setProfileImageMutation = useMutation(setProfileImageMutationRef);
  const setBannerImageMutation = useMutation(setBannerImageMutationRef);
  const generateUploadUrl = useMutation(generateUploadUrlMutationRef);

  // Upload a file to Convex storage
  const uploadFile = async (file: File): Promise<Id<"_storage">> => {
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    return storageId;
  };

  // Create guild with optional images
  const createGuild = async (
    data: CreateGuildData,
    profileImage?: File,
    bannerImage?: File
  ): Promise<Id<"guilds">> => {
    setIsCreating(true);
    setError(null);

    try {
      // Create the guild first
      const { guildId } = await createGuildMutation({
        name: data.name,
        description: data.description,
        visibility: data.visibility,
      });

      // Upload and set profile image if provided
      if (profileImage) {
        try {
          const storageId = await uploadFile(profileImage);
          await setProfileImageMutation({ guildId, storageId });
        } catch (uploadError) {
          console.error("Failed to upload profile image:", uploadError);
          toast.warning("Guild created but profile image upload failed");
        }
      }

      // Upload and set banner image if provided
      if (bannerImage) {
        try {
          const storageId = await uploadFile(bannerImage);
          await setBannerImageMutation({ guildId, storageId });
        } catch (uploadError) {
          console.error("Failed to upload banner image:", uploadError);
          toast.warning("Guild created but banner image upload failed");
        }
      }

      toast.success("Guild created successfully!");
      return guildId;
    } catch (err) {
      const message = handleHookError(err, "Failed to create guild");
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createGuild,
    uploadFile,
    generateUploadUrl,
    isCreating,
    error,
    clearError: () => setError(null),
  };
}
