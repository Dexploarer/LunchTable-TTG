import { AgentManagement } from "@/components/social/AgentManagement";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/social/useUserProfile";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  Calendar,
  Camera,
  Check,
  Clock,
  Copy,
  Gamepad2,
  Link2,
  Loader2,
  Lock,
  Percent,
  Settings,
  Share2,
  Shield,
  Swords,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Medal, Star, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Types
interface MatchHistoryItem {
  id: string;
  result: "victory" | "defeat";
  mode: string;
  opponent: {
    id: string;
    username: string;
  };
  ratingChange: number;
  timestamp: number;
}

// Format date
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

export const Route = createFileRoute("/_app/profile/$playerId")({
  component: PlayerProfilePage,
});

function PlayerProfilePage() {
  const { playerId } = Route.useParams() as { playerId: Id<"users"> };
  const {
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
    handleProfileImageUpload,
    generateReferralLink,
  } = useUserProfile({ playerId });

  const RankIcon =
    stats.rank.name === "Legend" ? Trophy : stats.rank.name === "Master" ? Star : Medal;

  if (profileUser === undefined) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] pt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8 max-w-5xl mx-auto">
            <div className="h-48 rounded-none bg-slate-200 border-[3px] border-black" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-none bg-slate-200 border-zine" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profileUser === null) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] pt-24">
        <div className="container mx-auto px-4 py-8 text-center max-w-lg">
          <div className="w-24 h-24 bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mx-auto mb-8 transform rotate-3">
            <Users className="w-12 h-12 text-black/20" />
          </div>
          <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter ink-bleed">
            Player Not Found
          </h2>
          <p className="text-black/60 font-medium mb-8 text-lg">
            This player profile does not exist or has been deleted.
          </p>
          <Button
            asChild
            className="h-12 px-8 bg-black text-white font-black uppercase text-lg border-zine hover:bg-black/80 hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-zine-sm hover:shadow-zine transition-all"
          >
            <Link to="/guilds">Back to Community</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if profile is private
  if (profilePrivacy && !profilePrivacy.isPublic && !profilePrivacy.isOwnProfile) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] pt-24">
        <div className="container mx-auto px-4 py-8 text-center max-w-lg">
          <div className="w-24 h-24 bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center mx-auto mb-8">
            <Lock className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Private Profile</h2>
          <p className="text-black/60 font-medium mb-8">
            This player has set their profile to private. Only they can view their profile
            information.
          </p>
          <Button
            asChild
            variant="outline"
            className="h-12 border-zine font-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
          >
            <Link to="/guilds">Back to Community</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#fdfbf7] pt-24 pb-20">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        {/* Profile Context Banner */}
        {isOwnProfile ? (
          <div className="mb-8 px-6 py-3 bg-amber-100 border-zine shadow-zine-sm flex items-center gap-3 text-sm font-bold uppercase tracking-wide max-w-fit mx-auto sm:mx-0">
            <Shield className="w-5 h-5 text-black" />
            <span className="text-black">Viewing your profile</span>
            <span className="text-black/30">|</span>
            <Link
              to="/settings"
              className="text-black/60 hover:text-black hover:underline underline-offset-4 decoration-2"
            >
              Edit settings
            </Link>
          </div>
        ) : (
          currentUser && (
            <div className="mb-8 px-6 py-3 bg-indigo-100 border-zine shadow-zine-sm flex items-center gap-3 text-sm font-bold uppercase tracking-wide max-w-fit mx-auto sm:mx-0">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <span className="text-indigo-900">
                Viewing {profileUser.username || "player"}'s profile
              </span>
            </div>
          )
        )}

        {/* Profile Header */}
        <div className="relative p-8 bg-white border-zine shadow-zine-lg mb-12 ink-wash">
          {/* Rank Badge */}
          {stats.rank && (
            <Badge
              className={cn(
                "absolute top-0 right-0 translate-x-[20%] -translate-y-[20%] text-xs px-4 py-2 font-black uppercase tracking-widest z-20 rounded-none shadow-zine rotate-3",
                "bg-yellow-400 text-black border-zine hover:bg-yellow-400"
              )}
            >
              <RankIcon className="w-4 h-4 mr-2" />
              {stats.rank.name}
            </Badge>
          )}

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative z-10 shrink-0">
              <Avatar className="w-40 h-40 border-zine shadow-zine rounded-none bg-slate-100">
                {profileUser.image && (
                  <AvatarImage
                    src={profileUser.image}
                    alt={`${profileUser.username || "User"} avatar`}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-slate-200 text-5xl font-black text-black/20 uppercase rounded-none">
                  {(profileUser.username || "U")[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              {isOwnProfile && (
                <>
                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleProfileImageUpload(file);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => profileImageInputRef.current?.click()}
                    disabled={isUploadingProfileImage}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-9 px-4 text-[10px] font-black uppercase tracking-wider bg-black text-white border-2 border-transparent hover:bg-white hover:text-black hover:border-black shadow-lg transition-all whitespace-nowrap"
                  >
                    {isUploadingProfileImage ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3 mr-2" />
                    )}
                    {isUploadingProfileImage ? "Uploading" : "Change Photo"}
                  </Button>
                </>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row items-center md:items-baseline gap-4 mb-4 border-b-2 border-primary/20 pb-4">
                <h1 className="text-5xl font-black uppercase tracking-tighter text-black leading-none">
                  {profileUser.username || "Unknown"}
                </h1>
                {userStats && (
                  <span className="bg-black text-white px-3 py-1 font-black text-sm uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                    LVL {userStats.level}
                  </span>
                )}
              </div>

              {/* Bio */}
              <div className="mb-6 min-h-[80px]">
                {profileUser.bio ? (
                  <p className="text-xl font-medium leading-relaxed font-handwriting text-black/80 rotate-[-1deg] max-w-2xl mx-auto md:mx-0">
                    "{profileUser.bio}"
                  </p>
                ) : isOwnProfile ? (
                  <p className="text-black/40 text-sm italic py-4 border-2 border-dashed border-black/20 bg-slate-50 flex items-center justify-center gap-2 max-w-md mx-auto md:mx-0">
                    Your bio is empty.{" "}
                    <Link
                      to="/settings"
                      className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 uppercase text-xs tracking-wider"
                    >
                      <Settings className="w-3 h-3" />
                      Add Bio
                    </Link>
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-widest text-black/60 bg-slate-100 p-4 border-2 border-black/10 inline-flex">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-black" />
                  Joined {profileUser.createdAt ? formatDate(profileUser.createdAt) : "Unknown"}
                </div>
                <div className="w-px h-4 bg-black/20 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-black" />
                  Seen{" "}
                  {profileUser.createdAt ? formatRelativeTime(profileUser.createdAt) : "Unknown"}
                </div>
                {userStats && userStats.xp > 0 && (
                  <>
                    <div className="w-px h-4 bg-black/20 hidden sm:block" />
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Star className="w-4 h-4" />
                      {userStats.xp.toLocaleString()} XP
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isOwnProfile && currentUser && (
              <div className="flex flex-col gap-3 w-full md:w-auto mt-6 md:mt-0">
                <Button className="h-12 px-8 bg-indigo-600 text-white font-black uppercase tracking-wider border-zine shadow-zine-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-zine hover:bg-indigo-700 transition-all">
                  <UserPlus className="w-5 h-5 mr-3" />
                  Add Friend
                </Button>
                <Button
                  variant="outline"
                  className="h-12 px-8 bg-white text-black font-black uppercase tracking-wider border-zine hover:bg-black hover:text-white transition-all"
                >
                  <Swords className="w-5 h-5 mr-3" />
                  Challenge
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={Gamepad2}
            label="Games Played"
            value={stats.gamesPlayed}
            color="bg-blue-100 text-blue-700"
          />
          <StatCard
            icon={Trophy}
            label="Games Won"
            value={stats.gamesWon}
            color="bg-yellow-100 text-yellow-700"
          />
          <StatCard
            icon={Percent}
            label="Win Rate"
            value={`${stats.winRate}%`}
            color="bg-green-100 text-green-700"
          />
          <StatCard
            icon={Target}
            label="Total Score"
            value={stats.totalScore.toLocaleString()}
            color="bg-purple-100 text-purple-700"
          />
        </div>

        {/* Detailed Stats Breakdown */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatPanel icon={Swords} title="Ranked Stats" accentColor="text-red-600">
              <div className="space-y-3 relative z-10">
                <StatRow label="Wins" value={userStats.rankedWins} />
                <StatRow label="Losses" value={userStats.rankedLosses} />
                <div className="flex justify-between text-base pt-3 border-t-2 border-black/10 mt-2">
                  <span className="font-bold uppercase tracking-wider text-black/60">ELO</span>
                  <span className="font-black text-black text-xl">{userStats.rankedElo}</span>
                </div>
              </div>
            </StatPanel>

            <StatPanel icon={Gamepad2} title="Casual Stats" accentColor="text-blue-600">
              <div className="space-y-3 relative z-10">
                <StatRow label="Wins" value={userStats.casualWins} />
                <StatRow label="Losses" value={userStats.casualLosses} />
                <div className="flex justify-between text-base pt-3 border-t-2 border-black/10 mt-2">
                  <span className="font-bold uppercase tracking-wider text-black/60">Rating</span>
                  <span className="font-black text-black text-xl">{userStats.casualRating}</span>
                </div>
              </div>
            </StatPanel>

            <StatPanel icon={Trophy} title="Story Mode" accentColor="text-amber-600">
              <div className="space-y-3 relative z-10">
                <StatRow label="Victories" value={userStats.storyWins} />
                <StatRow label="Level" value={userStats.level} />
                <div className="flex justify-between text-base pt-3 border-t-2 border-black/10 mt-2">
                  <span className="font-bold uppercase tracking-wider text-black/60">XP</span>
                  <span className="font-black text-black text-xl">
                    {userStats.xp.toLocaleString()}
                  </span>
                </div>
              </div>
            </StatPanel>
          </div>
        )}

        {/* Additional Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Recent Activity */}
          <div className="p-8 bg-white border-zine shadow-zine relative overflow-hidden min-h-[300px]">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-black uppercase tracking-tighter relative z-10 border-b-2 border-primary/20 pb-4">
              <div className="bg-black text-white p-2 transform -rotate-3 shadow-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              Battle Log
            </h3>

            <div className="relative z-10">
              {matchHistory === undefined ? (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-black/20 bg-slate-50">
                  <Loader2 className="w-8 h-8 text-black/20 animate-spin mb-2" />
                  <p className="text-black/40 text-xs font-bold uppercase tracking-widest">
                    Scanning Records...
                  </p>
                </div>
              ) : matchHistory === null ? (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-black/20 bg-slate-50">
                  <Lock className="w-8 h-8 text-black/20 mb-3" />
                  <p className="text-black/40 text-xs font-bold uppercase tracking-widest">
                    History is Classified
                  </p>
                </div>
              ) : matchHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-black/20 bg-slate-50">
                  <Swords className="w-8 h-8 text-black/20 mb-3" />
                  <p className="text-black/40 text-xs font-bold uppercase tracking-widest">
                    No Battles Recorded
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchHistory.map((match: MatchHistoryItem) => (
                    <div
                      key={match.id}
                      className={cn(
                        "flex items-center justify-between p-4 border-zine transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-zine",
                        match.result === "victory" ? "bg-green-50" : "bg-red-50"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-10 h-10 flex items-center justify-center border-2 border-black font-black text-lg",
                            match.result === "victory"
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          )}
                        >
                          {match.result === "victory" ? "W" : "L"}
                        </div>
                        <div>
                          <p className="font-bold text-black uppercase text-sm">
                            VS {match.opponent.username}
                          </p>
                          <p className="text-xs text-black/50 font-bold uppercase tracking-wider">
                            {match.mode}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-lg font-black",
                            match.ratingChange >= 0 ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {match.ratingChange >= 0 ? "+" : ""}
                          {match.ratingChange}
                        </p>
                        <p className="text-[10px] text-black/40 font-bold uppercase">
                          {formatRelativeTime(match.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="p-8 bg-white border-zine shadow-zine relative overflow-hidden">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-black uppercase tracking-tighter relative z-10 border-b-2 border-primary/20 pb-4">
              <div className="bg-yellow-400 text-black border-zine p-2 transform rotate-3 shadow-zine-sm">
                <Medal className="w-6 h-6" />
              </div>
              Trophies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
              <Achievement
                name="First Blood"
                description="Secure your initial victory"
                unlocked={stats.gamesWon >= 1}
              />
              <Achievement
                name="Lore Keeper"
                description="Study 100 encounters"
                unlocked={stats.gamesPlayed >= 100}
              />
              <Achievement
                name="Warlord"
                description="Conquer 50 fields"
                unlocked={stats.gamesWon >= 50}
              />
            </div>
          </div>
        </div>

        {/* Profile Settings (own profile only) */}
        {isOwnProfile && (
          <div className="space-y-12">
            {/* Referral Section */}
            <ReferralSection
              myReferralLink={myReferralLink}
              referralStats={referralStats}
              generateReferralLink={generateReferralLink}
            />

            {/* AI Agents Section */}
            <div className="p-8 bg-white border-zine shadow-zine relative overflow-hidden">
              <h3 className="text-2xl font-black mb-4 flex items-center gap-4 text-black uppercase tracking-tighter relative z-10 border-b-2 border-primary/20 pb-4">
                <div className="bg-indigo-600 text-white border-zine p-2 shadow-zine-sm">
                  <Bot className="w-6 h-6" />
                </div>
                AI Representatives
              </h3>
              <p className="text-black/60 font-bold uppercase tracking-wide text-xs mb-8 pl-1">
                Register elizaOS agents to battle on your behalf. Max 3 agents.
              </p>
              <AgentManagement />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Components
// ============================================================================

function StatPanel({
  icon: Icon,
  title,
  children,
  accentColor,
}: { icon: any; title: string; children: React.ReactNode; accentColor: string }) {
  return (
    <div className="p-6 bg-white border-zine shadow-zine relative overflow-hidden group hover:-translate-y-1 hover:shadow-zine-lg transition-all ink-wash">
      <h3 className="text-lg font-black mb-6 text-black uppercase tracking-widest flex items-center gap-3 border-b-2 border-black/10 pb-3">
        <Icon className={cn("w-5 h-5", accentColor)} />
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="font-bold text-black/50 uppercase tracking-widest">{label}</span>
      <span className="font-black text-black text-lg">{value}</span>
    </div>
  );
}

interface StatCardProps {
  icon: typeof Trophy;
  label: string;
  value: number | string;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="group p-6 bg-white border-zine shadow-zine-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-zine transition-all relative overflow-hidden ink-wash">
      <div
        className={cn(
          "absolute top-0 right-0 p-3 border-l-2 border-b-2 border-primary rounded-none",
          color
        )}
      >
        <Icon className="w-5 h-5 opacity-80" />
      </div>
      <div className="mt-4">
        <p className="text-4xl font-black text-black uppercase tracking-tighter leading-none mb-2">
          {value}
        </p>
        <p className="text-[10px] text-black/50 uppercase font-black tracking-widest leading-relaxed border-t-2 border-black/10 pt-2 inline-block">
          {label}
        </p>
      </div>
    </div>
  );
}

interface AchievementProps {
  name: string;
  description: string;
  unlocked: boolean;
}

function Achievement({ name, description, unlocked }: AchievementProps) {
  return (
    <div
      className={cn(
        "p-4 border-zine transition-all relative overflow-hidden h-full flex flex-col items-center text-center ink-wash",
        unlocked ? "bg-amber-50 shadow-zine" : "bg-slate-100 opacity-60 grayscale border-dashed"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center mb-3 border-zine",
          unlocked ? "bg-yellow-400 text-black shadow-zine-sm" : "bg-slate-300 text-black/40"
        )}
      >
        <Star className="w-6 h-6 fill-current" />
      </div>
      <p className="text-xs font-black uppercase tracking-widest mb-1 text-black">{name}</p>
      <p className="text-[10px] font-bold text-black/50 leading-tight">{description}</p>
    </div>
  );
}

// ============================================================================
// Referral Section
// ============================================================================

interface ReferralSectionProps {
  myReferralLink: { code: string; uses: number; createdAt: number } | null | undefined;
  referralStats:
    | {
        totalReferrals: number;
        referrals: Array<{ username?: string; image?: string; joinedAt: number }>;
      }
    | undefined;
  generateReferralLink: () => Promise<void>;
}

function ReferralSection({
  myReferralLink,
  referralStats,
  generateReferralLink,
}: ReferralSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [justCopied, setJustCopied] = useState<string | null>(null);

  const referralCode = myReferralLink?.code;
  const referralUrl = referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/referral/${referralCode}`
    : null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateReferralLink();
      toast.success("Referral link generated!");
    } catch {
      toast.error("Failed to generate referral link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setJustCopied(label);
      toast.success("Copied to clipboard!");
      setTimeout(() => setJustCopied(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="p-8 bg-white border-zine shadow-zine relative overflow-hidden ink-wash-reputation">
      <h3 className="text-2xl font-black mb-4 flex items-center gap-4 text-black uppercase tracking-tighter relative z-10 border-b-2 border-primary/20 pb-4">
        <div className="bg-green-500 text-white border-zine p-2 shadow-zine-sm transform -rotate-2">
          <Share2 className="w-6 h-6" />
        </div>
        Recruitment
      </h3>
      <p className="text-black/60 text-xs font-bold uppercase tracking-wide mb-8 border-l-4 border-black pl-4 py-1">
        Invite friends to Lunchtable TCG. Share your unique link and build your faction.
      </p>

      <div className="space-y-6 relative z-10">
        {/* Referral Link */}
        {myReferralLink === undefined ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-black" />
          </div>
        ) : referralUrl ? (
          <div className="space-y-6">
            {/* Link display + copy */}
            <div className="flex items-center gap-0">
              <div className="flex-1 bg-slate-100 border-zine border-r-0 p-3 overflow-hidden font-mono text-sm text-black font-bold">
                {referralUrl}
              </div>
              <Button
                onClick={() => handleCopy(referralUrl, "link")}
                className="h-full rounded-none border-zine bg-black text-white hover:bg-slate-800 px-6 font-black uppercase"
              >
                {justCopied === "link" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Regenerate */}
            <div className="flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="outline"
                size="sm"
                className="border-2 border-black text-black/60 hover:text-black hover:border-black font-bold uppercase text-xs h-8"
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-2" />
                ) : (
                  <Link2 className="w-3 h-3 mr-2" />
                )}
                Generate New Link
              </Button>
            </div>
          </div>
        ) : (
          /* No link yet */
          <div className="text-center py-8 space-y-4 bg-slate-50 border-zine border-dashed">
            <div className="w-16 h-16 mx-auto bg-white border-zine flex items-center justify-center shadow-zine-sm">
              <Share2 className="w-8 h-8 text-black" />
            </div>
            <div>
              <p className="text-black font-black uppercase tracking-tight text-lg">
                No referral link yet
              </p>
              <p className="text-xs font-bold text-black/40 uppercase tracking-widest mt-1">
                Generate a link to share with friends
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-black text-white px-8 py-6 font-black uppercase tracking-widest border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              Generate Referral Link
            </Button>
          </div>
        )}

        {/* Referral Stats */}
        {referralStats && referralStats.totalReferrals > 0 && (
          <div className="space-y-4 pt-6 border-t-[3px] border-black">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-black" />
              <span className="text-sm font-black text-black uppercase tracking-widest">
                {referralStats.totalReferrals}{" "}
                {referralStats.totalReferrals === 1 ? "Recruit" : "Recruits"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {referralStats.referrals.map((ref, i) => (
                <div
                  key={`referral-${i}`}
                  className="flex items-center gap-3 p-3 bg-white border-zine shadow-zine-sm hover:shadow-zine hover:-translate-y-0.5 transition-all"
                >
                  <Avatar className="w-8 h-8 border-zine">
                    {ref.image && <AvatarImage src={ref.image} alt={ref.username || "User"} />}
                    <AvatarFallback className="bg-slate-200 text-black text-xs font-bold">
                      {(ref.username || "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-black truncate uppercase leading-none mb-0.5">
                      {ref.username || "Unknown"}
                    </p>
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide">
                      Joined {formatRelativeTime(ref.joinedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
