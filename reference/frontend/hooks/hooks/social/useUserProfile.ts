"use client";

import { useAuth } from "@/hooks/auth/useConvexAuthHook";
import { api } from "@/lib/convexApiWrapper";
import type { Id } from "@convex/_generated/dataModel";
import { calculateWinRate, getUserRank } from "@ltcg/core";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export interface UseUserProfileOptions {
  playerId: Id<"users">;
}

export function useUserProfile({ playerId }: UseUserProfileOptions) {
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated } = useAuth();

  // Queries
  const currentUser = useQuery(api.core.users.currentUser, isAuthenticated ? {} : "skip");
  const profileUser = useQuery(api.core.users.getUser, { userId: playerId });
  const userStats = useQuery(api.core.users.getUserStats, { userId: playerId });
  const profilePrivacy = useQuery(api.progression.matchHistory.getProfilePrivacy, {
    userId: playerId,
  });
  const matchHistory = useQuery(api.progression.matchHistory.getPublicMatchHistory, {
    userId: playerId,
    limit: 5,
  });

  const isOwnProfile = currentUser?._id === playerId;

  // Referral data (only for own profile)
  const myReferralLink = useQuery(
    api.social.referrals.getMyReferralLink,
    isOwnProfile ? {} : "skip"
  );
  const referralStats = useQuery(api.social.referrals.getReferralStats, isOwnProfile ? {} : "skip");

  // Mutations
  const generateUploadUrl = useMutation(api.storage.images.generateUploadUrl);
  const setProfileImage = useMutation(api.core.userPreferences.setProfileImage);
  const generateReferralLinkMutation = useMutation(api.social.referrals.generateReferralLink);

  // Derived state
  const stats = useMemo(() => {
    const gamesWon = userStats?.totalWins ?? 0;
    const gamesLosses = userStats?.totalLosses ?? 0;
    const gamesPlayed = gamesWon + gamesLosses;
    const totalScore = (userStats?.rankedElo ?? 1000) + (userStats?.casualRating ?? 1000);
    const winRate = calculateWinRate(gamesWon, gamesLosses);
    const rank = getUserRank(gamesWon);

    return {
      gamesPlayed,
      gamesWon,
      totalScore,
      winRate,
      rank,
      level: userStats?.level ?? 1,
      xp: userStats?.xp ?? 0,
    };
  }, [userStats]);

  const handleProfileImageUpload = async (file: File) => {
    if (!isOwnProfile) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large. Maximum size is 5MB.");
      return;
    }

    setIsUploadingProfileImage(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload profile image");
      }

      const { storageId } = (await uploadResponse.json()) as { storageId?: Id<"_storage"> };
      if (!storageId) {
        throw new Error("Upload did not return a storage ID");
      }

      await setProfileImage({ storageId });
      toast.success("Profile picture updated");
    } catch (error) {
      console.error("Profile picture upload failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile picture");
    } finally {
      setIsUploadingProfileImage(false);
      if (profileImageInputRef.current) {
        profileImageInputRef.current.value = "";
      }
    }
  };

  const generateReferralLink = async () => {
    try {
      await generateReferralLinkMutation({});
      toast.success("Referral link generated!");
    } catch {
      toast.error("Failed to generate referral link");
    }
  };

  return {
    // State
    currentUser,
    profileUser,
    userStats,
    profilePrivacy,
    matchHistory,
    isOwnProfile,
    myReferralLink,
    referralStats,
    isUploadingProfileImage,
    profileImageInputRef,
    stats,
    isAuthenticated,

    // Handlers
    handleProfileImageUpload,
    generateReferralLink,
  };
}
