import {
  Award,
  BookOpen,
  Heart,
  Map as MapIcon,
  Settings,
  Sparkles,
  Store,
  Swords,
  Target,
  Trophy,
  User,
  Users,
  Wallet,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: typeof Swords;
  comingSoon?: boolean;
}

export interface NavGroup {
  label: string;
  links: NavLink[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Play",
    links: [
      { href: "/lunchtable", label: "The Table", icon: Swords },
      { href: "/play/story", label: "Story Mode", icon: MapIcon },
      { href: "/tournaments", label: "Tournaments", icon: Award },
    ],
  },
  {
    label: "Progress",
    links: [
      { href: "/battle-pass", label: "Battle Pass", icon: Sparkles },
      { href: "/quests", label: "Quests", icon: Target },
      { href: "/leaderboards", label: "Leaderboards", icon: Trophy },
    ],
  },
  {
    label: "Community",
    links: [
      { href: "/friends", label: "Friends", icon: Heart },
      { href: "/guilds", label: "Guilds", icon: Users },
    ],
  },
  {
    label: "Economy",
    links: [
      { href: "/shop", label: "Shop", icon: Store },
      { href: "/lunchmoney", label: "LunchMoney", icon: Wallet },
    ],
  },
  {
    label: "Collection",
    links: [
      { href: "/binder", label: "Binder", icon: BookOpen },
      { href: "/profile", label: "Profile", icon: User },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];
