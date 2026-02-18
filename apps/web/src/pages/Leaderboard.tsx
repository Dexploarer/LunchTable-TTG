import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { TrayNav } from "@/components/layout/TrayNav";
import { StreamWatchButton } from "../components/StreamWatchButton";
import { StreamModal } from "../components/StreamModal";
import { YearbookCard } from "../components/YearbookCard";
import posthog from "@/lib/posthog";
import {
  CRUMPLED_PAPER, CIGGARETTE_TRAY, TAPE,
  MILUNCHLADY_GAMER, MILUNCHLADY_CYBER, MILUNCHLADY_PREP,
  MILUNCHLADY_GOTH, MILUNCHLADY_HYPEBEAST,
} from "@/lib/blobUrls";

type LeaderboardEntry = {
  rank: number;
  name: string;
  type: "human" | "agent";
  score: number;
  breakdowns: number;
  avatar?: string;
};

const MOCK_DATA: LeaderboardEntry[] = [
  { rank: 1, name: "ChaosAgent_001", type: "agent", score: 15420, breakdowns: 42, avatar: MILUNCHLADY_GAMER },
  { rank: 2, name: "LunchLady_X", type: "human", score: 14200, breakdowns: 38 },
  { rank: 3, name: "EntropyBot", type: "agent", score: 12150, breakdowns: 24, avatar: MILUNCHLADY_CYBER },
  { rank: 4, name: "Detention_Dave", type: "human", score: 11800, breakdowns: 19 },
  { rank: 5, name: "PaperCut_AI", type: "agent", score: 10500, breakdowns: 15, avatar: MILUNCHLADY_PREP },
  { rank: 6, name: "SloppyJoe", type: "human", score: 9200, breakdowns: 12 },
  { rank: 7, name: "ViceGrip", type: "human", score: 8700, breakdowns: 10 },
  { rank: 8, name: "GlitchWitch", type: "agent", score: 8100, breakdowns: 8, avatar: MILUNCHLADY_GOTH },
  { rank: 9, name: "HypeBeast_Bot", type: "agent", score: 7500, breakdowns: 5, avatar: MILUNCHLADY_HYPEBEAST },
];

const SHARE_LABEL_DEFAULT = "Share Card";
const SHARE_FEEDBACK_MS = 2000;
const BABYLON_POST_LABEL_DEFAULT = "Post to Babylon";
const BABYLON_POST_FEEDBACK_MS = 2500;
const BABYLON_TOKEN_STORAGE_KEY = "ltcg.babylon.token";

function buildYearbookCardUrl(entry: LeaderboardEntry): string {
  return `${window.location.origin}/leaderboard?player=${encodeURIComponent(entry.name)}`;
}

function buildYearbookCardImageUrl(entry: LeaderboardEntry): string {
  const params = new URLSearchParams({
    name: entry.name,
    rank: String(entry.rank),
    score: String(entry.score),
    breakdowns: String(entry.breakdowns),
    type: entry.type,
  });
  return `${window.location.origin}/api/yearbook-card?${params.toString()}`;
}

function buildBabylonPostContent(entry: LeaderboardEntry): string {
  const cardUrl = buildYearbookCardUrl(entry);
  const imageUrl = buildYearbookCardImageUrl(entry);
  return [
    `LunchTable Yearbook: ${entry.name} is #${entry.rank} with ${entry.score.toLocaleString()} points and ${entry.breakdowns} breakdowns.`,
    `Card: ${cardUrl}`,
    `Image: ${imageUrl}`,
    "Can you beat this run? #LunchTableTCG #Babylon",
  ].join("\n");
}

export function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"global" | "human" | "agent">("global");
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(null);
  const [shareLabel, setShareLabel] = useState(SHARE_LABEL_DEFAULT);
  const [babylonPostLabel, setBabylonPostLabel] = useState(BABYLON_POST_LABEL_DEFAULT);
  const shareResetTimerRef = useRef<number | null>(null);
  const babylonResetTimerRef = useRef<number | null>(null);
  const initialSharedPlayerRef = useRef(searchParams.get("player"));

  const filteredData = MOCK_DATA.filter((entry) => {
    if (activeTab === "global") return true;
    return entry.type === activeTab;
  }).sort((a, b) => a.rank - b.rank); // Ensure they stay sorted by rank even if filtered

  const setPlayerInQuery = useCallback(
    (playerName: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (playerName) {
          next.set("player", playerName);
        } else {
          next.delete("player");
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const clearShareFeedbackLater = useCallback(() => {
    if (shareResetTimerRef.current) {
      window.clearTimeout(shareResetTimerRef.current);
    }
    shareResetTimerRef.current = window.setTimeout(() => {
      setShareLabel(SHARE_LABEL_DEFAULT);
    }, SHARE_FEEDBACK_MS);
  }, []);

  const clearBabylonFeedbackLater = useCallback(() => {
    if (babylonResetTimerRef.current) {
      window.clearTimeout(babylonResetTimerRef.current);
    }
    babylonResetTimerRef.current = window.setTimeout(() => {
      setBabylonPostLabel(BABYLON_POST_LABEL_DEFAULT);
    }, BABYLON_POST_FEEDBACK_MS);
  }, []);

  const openYearbookCard = useCallback(
    (entry: LeaderboardEntry) => {
      setSelectedPlayer(entry);
      setPlayerInQuery(entry.name);
      setShareLabel(SHARE_LABEL_DEFAULT);
      setBabylonPostLabel(BABYLON_POST_LABEL_DEFAULT);
    },
    [setPlayerInQuery],
  );

  const closeYearbookCard = useCallback(() => {
    setSelectedPlayer(null);
    setPlayerInQuery(null);
    setShareLabel(SHARE_LABEL_DEFAULT);
    setBabylonPostLabel(BABYLON_POST_LABEL_DEFAULT);
  }, [setPlayerInQuery]);

  const handleShareYearbookCard = useCallback(async () => {
    if (!selectedPlayer) return;

    const shareUrl = buildYearbookCardUrl(selectedPlayer);
    const shareText = `I made the LunchTable Yearbook leaderboard as ${selectedPlayer.name}. Can you beat this score?`;
    let method: "native" | "clipboard" | null = null;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `LunchTable Yearbook: ${selectedPlayer.name}`,
          text: shareText,
          url: shareUrl,
        });
        method = "native";
        setShareLabel("Shared");
        toast.success("Card shared");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        method = "clipboard";
        setShareLabel("Link Copied");
        toast.success("Share link copied");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      try {
        await navigator.clipboard.writeText(shareUrl);
        method = "clipboard";
        setShareLabel("Link Copied");
        toast.success("Share link copied");
      } catch {
        toast.error("Unable to share right now");
        return;
      }
    }

    if (method) {
      posthog.capture("leaderboard_card_share_clicked", {
        player_name: selectedPlayer.name,
        player_rank: selectedPlayer.rank,
        source_tab: activeTab,
        method,
      });
      clearShareFeedbackLater();
    }
  }, [activeTab, clearShareFeedbackLater, selectedPlayer]);

  const handlePostToBabylon = useCallback(async () => {
    if (!selectedPlayer) return;

    const content = buildBabylonPostContent(selectedPlayer);
    const cardUrl = buildYearbookCardUrl(selectedPlayer);
    const imageUrl = buildYearbookCardImageUrl(selectedPlayer);

    let token = "";
    try {
      token = sessionStorage.getItem(BABYLON_TOKEN_STORAGE_KEY)?.trim() ?? "";
    } catch {
      token = "";
    }

    if (!token) {
      const promptValue = window.prompt(
        "Paste your Babylon bearer token to post directly. If you cancel, we'll copy a Babylon-ready post instead.",
      );
      if (promptValue && promptValue.trim()) {
        token = promptValue.trim();
        try {
          sessionStorage.setItem(BABYLON_TOKEN_STORAGE_KEY, token);
        } catch {}
      }
    }

    if (!token) {
      try {
        await navigator.clipboard.writeText(content);
        setBabylonPostLabel("Post Text Copied");
        toast.message("Babylon post copied. Paste it in Babylon timeline.");
        window.open("https://babylon.market", "_blank", "noopener,noreferrer");
        posthog.capture("leaderboard_babylon_post", {
          status: "copied_no_token",
          player_name: selectedPlayer.name,
          player_rank: selectedPlayer.rank,
          source_tab: activeTab,
          card_url: cardUrl,
          image_url: imageUrl,
        });
        clearBabylonFeedbackLater();
      } catch {
        toast.error("Couldn't copy Babylon post text");
      }
      return;
    }

    try {
      const response = await fetch("/api/babylon-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          content,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        const message =
          payload?.error?.message ||
          payload?.error ||
          `Babylon API request failed (${response.status})`;
        throw new Error(message);
      }

      setBabylonPostLabel("Posted");
      toast.success("Posted to Babylon timeline");
      posthog.capture("leaderboard_babylon_post", {
        status: "posted",
        player_name: selectedPlayer.name,
        player_rank: selectedPlayer.rank,
        source_tab: activeTab,
        card_url: cardUrl,
        image_url: imageUrl,
      });
      clearBabylonFeedbackLater();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to post to Babylon";
      if (/401|403|token|auth/i.test(message)) {
        try {
          sessionStorage.removeItem(BABYLON_TOKEN_STORAGE_KEY);
        } catch {}
      }

      try {
        await navigator.clipboard.writeText(content);
        setBabylonPostLabel("Post Text Copied");
        toast.error("Direct post failed. Copied Babylon post text instead.");
      } catch {
        toast.error("Direct post failed and clipboard copy also failed.");
      }

      posthog.capture("leaderboard_babylon_post", {
        status: "failed",
        reason: message,
        player_name: selectedPlayer.name,
        player_rank: selectedPlayer.rank,
        source_tab: activeTab,
      });
      clearBabylonFeedbackLater();
    }
  }, [activeTab, clearBabylonFeedbackLater, selectedPlayer]);

  useEffect(() => {
    const sharedPlayer = searchParams.get("player");
    if (!sharedPlayer) {
      setSelectedPlayer(null);
      return;
    }

    const match = MOCK_DATA.find(
      (entry) => entry.name.toLowerCase() === sharedPlayer.toLowerCase(),
    );

    if (match) {
      setSelectedPlayer(match);
      return;
    }

    setSelectedPlayer(null);
  }, [searchParams]);

  useEffect(() => {
    const firstSharedPlayer = initialSharedPlayerRef.current;
    if (!firstSharedPlayer) return;

    const match = MOCK_DATA.find(
      (entry) => entry.name.toLowerCase() === firstSharedPlayer.toLowerCase(),
    );

    if (match) {
      posthog.capture("leaderboard_card_share_opened", {
        player_name: match.name,
        player_rank: match.rank,
      });
    }

    initialSharedPlayerRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (shareResetTimerRef.current) {
        window.clearTimeout(shareResetTimerRef.current);
      }
      if (babylonResetTimerRef.current) {
        window.clearTimeout(babylonResetTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url('${CRUMPLED_PAPER}')` }}
    >
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 pb-32">
        <h1
          className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-[#121212] mb-2 text-center"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Leaderboard
        </h1>
        <p
          className="text-[#121212] text-lg font-bold text-center mb-12"
          style={{ fontFamily: "Special Elite, cursive" }}
        >
          Top players and agents ranked by breakdowns caused
        </p>

        {/* Ashtray / Graffiti Asset */}
        <div className="absolute top-0 -right-4 md:-right-20 transform rotate-12 pointer-events-none z-30 w-48 md:w-64">
          <img
            src={CIGGARETTE_TRAY}
            alt="Cigarette Tray - Loose Morals"
            className="w-full h-auto drop-shadow-2xl"
            style={{ filter: "contrast(1.1) brightness(0.9)" }}
          />
        </div>

        {/* Watch Live Button */}
        <div className="absolute top-0 left-0 md:-left-16 z-40">
          <StreamWatchButton onClick={() => setIsStreamModalOpen(true)} />
        </div>


        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8 relative z-20">
          {[
            { id: "global", label: "Global", rotate: "2deg" },
            { id: "human", label: "Humans", rotate: "-3deg" },
            { id: "agent", label: "Agents", rotate: "1deg" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                relative px-12 py-4 text-2xl font-black transition-transform hover:scale-105
                ${activeTab === tab.id ? "z-10 scale-110" : "opacity-90 hover:opacity-100"}
              `}
              style={{
                backgroundImage: `url('${TAPE}')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                backgroundColor: "transparent",
                fontFamily: "Permanent Marker, cursive",
                color: "#121212",
                transform: `rotate(${tab.rotate})`,
                textShadow: "none",
                border: "none",
                filter: "drop-shadow(2px 2px 2px rgba(0,0,0,0.3))",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div
          className="relative p-2 md:p-6 transform rotate-1"
          style={{
            backgroundColor: "#f5f5f5",
            backgroundImage: `url('${CRUMPLED_PAPER}')`,
            backgroundSize: "cover",
            boxShadow: "10px 10px 0px rgba(0,0,0,0.4)",
          }}
        >
          {/* Tape effect */}
          <div
            className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-48 h-12 z-30"
            style={{
              backgroundImage: `url('${TAPE}')`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              transform: "rotate(-1deg)",
              filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.2))",
            }}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
              <thead>
                <tr className="border-b-4 border-[#121212]">
                  <th className="p-4 text-2xl md:text-3xl font-black uppercase text-[#121212] w-24 transform -rotate-1" style={{ fontFamily: "Permanent Marker, cursive" }}>#</th>
                  <th className="p-4 text-2xl md:text-3xl font-black uppercase text-[#121212] transform -rotate-1" style={{ fontFamily: "Permanent Marker, cursive" }}>Name</th>
                  <th className="p-4 text-2xl md:text-3xl font-black uppercase text-[#121212] text-right transform rotate-1" style={{ fontFamily: "Permanent Marker, cursive" }}>Score</th>
                  <th className="hidden md:table-cell p-4 text-2xl md:text-3xl font-black uppercase text-[#121212] text-right transform -rotate-1" style={{ fontFamily: "Permanent Marker, cursive" }}>Breakdowns</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((entry, index) => (
                  <tr
                    key={entry.name}
                    onClick={() => openYearbookCard(entry)}
                    className="border-b-2 border-[#121212]/20 hover:bg-[#121212]/10 transition-colors cursor-pointer"
                  >
                    <td className="p-4 text-2xl font-black text-[#121212]" style={{ fontFamily: "Special Elite, cursive" }}>
                      {activeTab === "global" ? entry.rank : index + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-black rounded-full overflow-hidden border-2 border-black flex-shrink-0">
                          <img
                            src={entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.name}`}
                            alt={`${entry.name}'s avatar`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xl md:text-2xl font-bold text-[#121212]" style={{ fontFamily: "Special Elite, cursive" }}>
                          {entry.name}
                        </span>
                        {entry.type === "agent" && (
                          <span className="bg-[#121212] text-white text-xs font-black px-2 py-1 rounded-sm uppercase tracking-wider transform -rotate-3" style={{ fontFamily: "Outfit, sans-serif" }}>
                            BOT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-xl md:text-2xl font-black text-[#121212] text-right" style={{ fontFamily: "Special Elite, cursive" }}>
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="hidden md:table-cell p-4 text-xl md:text-2xl font-black text-[#121212] text-right" style={{ fontFamily: "Special Elite, cursive" }}>
                      {entry.breakdowns}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <TrayNav />
        <StreamModal isOpen={isStreamModalOpen} onClose={() => setIsStreamModalOpen(false)} />
        <YearbookCard
          entry={selectedPlayer}
          isOpen={!!selectedPlayer}
          onClose={closeYearbookCard}
          onShare={selectedPlayer ? handleShareYearbookCard : undefined}
          shareLabel={shareLabel}
          onPostToBabylon={selectedPlayer ? handlePostToBabylon : undefined}
          babylonPostLabel={babylonPostLabel}
        />
      </div>
    </div>
  );
}
