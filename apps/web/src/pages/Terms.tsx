import { TrayNav } from "@/components/layout/TrayNav";
import { LANDING_BG, MENU_TEXTURE } from "@/lib/blobUrls";

export function Terms() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url('${LANDING_BG}')` }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 pb-20">
        <div
          className="relative p-6 md:p-12"
          style={{
            backgroundImage: `url('${MENU_TEXTURE}')`,
            backgroundSize: "512px",
            backgroundRepeat: "repeat",
          }}
        >
          <div className="absolute inset-0 bg-white/60 pointer-events-none" />

          <div className="relative">
            <h1
              className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-[#121212] mb-6"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Terms of Service
            </h1>

            <div
              className="space-y-4 text-[#121212]/80 text-sm md:text-base leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <p
                className="text-xs text-[#121212]/50"
                style={{ fontFamily: "Special Elite, cursive" }}
              >
                Last updated: February 2026
              </p>

              <h2 className="text-lg font-bold text-[#121212] mt-6" style={{ fontFamily: "Outfit, sans-serif" }}>
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using LunchTable TTG, you agree to be bound by these Terms of Service. If you do not
                agree, do not use the service.
              </p>

              <h2 className="text-lg font-bold text-[#121212] mt-6" style={{ fontFamily: "Outfit, sans-serif" }}>
                2. The Platform
              </h2>
              <p>
                LunchTable TTG is an AI-native tabletop platform inspired by Roll20-style workflows. It includes a
                creator studio for building worlds and rules, and a live table for running sessions with maps, tokens,
                fog, chat, and dice. Platform features and policies may change without notice.
              </p>

              <h2 className="text-lg font-bold text-[#121212] mt-6" style={{ fontFamily: "Outfit, sans-serif" }}>
                3. Accounts
              </h2>
              <p>
                You are responsible for maintaining the security of your account. One account per person. Accounts
                created through Privy authentication are subject to Privy's terms of service. Sharing accounts or using
                automated tools to gain unfair advantage is prohibited.
              </p>

              <h2 className="text-lg font-bold text-[#121212] mt-6" style={{ fontFamily: "Outfit, sans-serif" }}>
                4. AI Agents
              </h2>
              <p>
                AI agents may participate in sessions as narrators, NPCs, or assistants. Agent actions may post to the
                session event log (for example chat narration). You are responsible for how you use AI features and for
                any content you choose to generate or share in a session.
              </p>

              <h2 className="text-lg font-bold text-[#121212] mt-6" style={{ fontFamily: "Outfit, sans-serif" }}>
                5. Content and Worlds
              </h2>
              <p>
                Worlds, maps, tokens, journals, chat logs, and other session artifacts are digital content within
                LunchTable TTG. You retain your rights to content you create where applicable, but you grant us the
                rights needed to host, process, and display that content for platform operation (including moderation,
                publishing, and discovery features).
              </p>

              <h2 className="text-lg font-bold text-[#121212] mt-6" style={{ fontFamily: "Outfit, sans-serif" }}>
                6. Conduct
              </h2>
              <p>
                Players must not exploit bugs, manipulate matchmaking, harass other players, or interfere with gameplay
                systems. Violations may result in temporary or permanent account suspension.
              </p>

              <h2 className="text-lg font-bold text-[#121212] mt-6" style={{ fontFamily: "Outfit, sans-serif" }}>
                7. Streaming & Content
              </h2>
              <p>
                Sessions may be recorded by participants or captured in logs for platform operation. By participating,
                you grant LunchTable a non-exclusive license to display your username and in-session actions to other
                session participants and (if you choose to publish) to discovery and community surfaces.
              </p>

              <h2 className="text-lg font-bold text-[#121212] mt-6" style={{ fontFamily: "Outfit, sans-serif" }}>
                8. Limitation of Liability
              </h2>
              <p>
                LunchTable is provided "as is" without warranties of any kind. We are not liable for any loss of game
                data, interruptions of service, or actions taken by AI agents during gameplay.
              </p>

              <h2 className="text-lg font-bold text-[#121212] mt-6" style={{ fontFamily: "Outfit, sans-serif" }}>
                9. Changes
              </h2>
              <p>
                We may update these terms at any time. Continued use of the service after changes constitutes acceptance
                of the revised terms.
              </p>
            </div>
          </div>
        </div>
      </div>

      <TrayNav />
    </div>
  );
}
