"use client";

import { useAuth } from "@/hooks/auth/useConvexAuthHook";
import { useTokenBalance } from "@/hooks/economy/useTokenBalance";
import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGameWallet } from "../wallet/useGameWallet";

export type SettingsTab =
  | "account"
  | "wallet"
  | "notifications"
  | "display"
  | "game"
  | "privacy"
  | "streaming";

export function useSettingsInteraction() {
  const { isAuthenticated } = useAuth();

  // Data Fetching
  const currentUser = useConvexQuery(
    typedApi.core.users.currentUser,
    isAuthenticated ? {} : "skip"
  );
  const preferences = useConvexQuery(
    typedApi.core.userPreferences.getPreferences,
    isAuthenticated ? {} : "skip"
  );

  // Mutations
  const updatePreferences = useConvexMutation(typedApi.core.userPreferences.updatePreferences);
  const updateUsername = useConvexMutation(typedApi.core.userPreferences.updateUsername);
  const updateBio = useConvexMutation(typedApi.core.userPreferences.updateBio);
  const deleteAccount = useConvexMutation(typedApi.core.userPreferences.deleteAccount);

  // Wallet
  const wallet = useGameWallet();
  const tokenBalance = useTokenBalance();

  // State
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Dirty State
  const [isDirty, setIsDirty] = useState(false);

  // Account Fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  // Account Deletion State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Preference States (initialized with defaults, updated from query)
  const [notifications, setNotifications] = useState({
    questComplete: true,
    matchInvites: true,
    friendRequests: true,
    marketplaceSales: true,
    dailyReminders: false,
    promotions: false,
  });

  const [display, setDisplay] = useState({
    animations: true,
    reducedMotion: false,
    cardQuality: "high" as "low" | "medium" | "high",
    showDamageNumbers: true,
  });

  const [game, setGame] = useState({
    soundEnabled: true,
    musicEnabled: true,
    soundVolume: 80,
    musicVolume: 60,
    autoEndTurn: false,
    confirmActions: true,
    showTutorialHints: true,
  });

  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showOnlineStatus: true,
    allowFriendRequests: true,
    showMatchHistory: true,
  });

  const [streaming, setStreaming] = useState({
    streamerModeEnabled: false,
  });

  // Load preferences when available
  useEffect(() => {
    if (preferences) {
      setNotifications((prev) => ({
        ...prev,
        ...(preferences.notifications as Record<string, unknown>),
      }));
      setDisplay((prev) => ({ ...prev, ...(preferences.display as Record<string, unknown>) }));
      setGame((prev) => ({ ...prev, ...(preferences.game as Record<string, unknown>) }));
      setPrivacy((prev) => ({ ...prev, ...(preferences.privacy as Record<string, unknown>) }));
      setStreaming((prev) => ({ ...prev, ...(preferences.streaming as Record<string, unknown>) }));
    }
  }, [preferences]);

  // Load user data
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || "");
      setEmail(currentUser.email || "");
      setBio(currentUser.bio || "");
    }
  }, [currentUser]);

  // Check dirty state
  useEffect(() => {
    if (!preferences) return;
    const hasChanges =
      JSON.stringify(notifications) !== JSON.stringify(preferences.notifications) ||
      JSON.stringify(display) !== JSON.stringify(preferences.display) ||
      JSON.stringify(game) !== JSON.stringify(preferences.game) ||
      JSON.stringify(privacy) !== JSON.stringify(preferences.privacy) ||
      JSON.stringify(streaming) !== JSON.stringify(preferences.streaming) ||
      username !== (currentUser?.username || "") ||
      bio !== (currentUser?.bio || "");
    setIsDirty(hasChanges);
  }, [
    notifications,
    display,
    game,
    privacy,
    streaming,
    username,
    bio,
    preferences,
    currentUser?.username,
    currentUser?.bio,
  ]);

  // Prevent unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Actions
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (username !== currentUser?.username) {
        const result = await updateUsername({ username });
        if (!result.success) {
          toast.error(result.error || "Failed to update username");
          setIsSaving(false);
          return;
        }
      }

      if (bio !== (currentUser?.bio || "")) {
        await updateBio({ bio });
      }

      await updatePreferences({
        notifications,
        display,
        game,
        privacy,
        streaming,
      });

      setSaveSuccess(true);
      toast.success("Settings saved successfully");
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      toast.error("Failed to save settings");
      console.error("Save settings error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      toast.error("Please enter your password to confirm");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const result = await deleteAccount({
        confirmPassword: deleteConfirmPassword,
      });

      if (result.success) {
        toast.success("Account deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete account");
        setIsDeletingAccount(false);
      }
    } catch (error) {
      toast.error("Failed to delete account");
      console.error("Account deletion error:", error);
      setIsDeletingAccount(false);
    }
  };

  return {
    isAuthenticated,
    isLoading: !currentUser || !preferences,
    activeTab,
    setActiveTab,
    isSaving,
    saveSuccess,
    isDirty,

    // User Data
    currentUser,

    // Form States
    forms: {
      username,
      setUsername,
      email,
      bio,
      setBio,
      notifications,
      setNotifications,
      display,
      setDisplay,
      game,
      setGame,
      privacy,
      setPrivacy,
      streaming,
      setStreaming,
    },

    // Actions
    handleSave,

    // Account Deletion
    deletion: {
      showConfirm: showDeleteConfirm,
      setShowConfirm: setShowDeleteConfirm,
      password: deleteConfirmPassword,
      setPassword: setDeleteConfirmPassword,
      isDeleting: isDeletingAccount,
      handleDelete: handleDeleteAccount,
    },

    // Wallet
    wallet: {
      ...wallet,
      showConnect: showWalletConnect,
      setShowConnect: setShowWalletConnect,
      showDisconnectConfirm,
      setShowDisconnectConfirm,
    },
    tokenBalance,
  };
}
