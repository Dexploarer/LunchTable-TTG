import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import { Toaster } from "sonner";
import { AudioControlsDock, useAudio } from "@/components/audio/AudioProvider";
import { getAudioContextFromPath } from "@/lib/audio/routeContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Home } from "@/pages/Home";
import { Studio } from "@/pages/Studio";
import { Worlds } from "@/pages/Worlds";
import { WorldDetail } from "@/pages/WorldDetail";
import { Table } from "@/pages/Table";
import { Lfg } from "@/pages/Lfg";
import { Publish } from "@/pages/Publish";
import { AgentOps } from "@/pages/AgentOps";
import { ProviderSettings } from "@/pages/ProviderSettings";
import { Privacy } from "@/pages/Privacy";
import { Terms } from "@/pages/Terms";
import { About } from "@/pages/About";

const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

function RouteAudioContextSync() {
  const location = useLocation();
  const { setContextKey } = useAudio();

  useEffect(() => {
    setContextKey(getAudioContextFromPath(location.pathname));
  }, [location.pathname, setContextKey]);

  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <RouteAudioContextSync />
      <SentryRoutes>
        <Route path="/" element={<Home />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/worlds" element={<Worlds />} />
        <Route path="/worlds/:worldId" element={<WorldDetail />} />
        <Route path="/table/:sessionId" element={<Table />} />
        <Route path="/lfg" element={<Lfg />} />
        <Route path="/publish" element={<Publish />} />
        <Route path="/agent-ops" element={<AgentOps />} />
        <Route
          path="/settings/providers"
          element={
            <AuthGuard>
              <ProviderSettings />
            </AuthGuard>
          }
        />

        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/about" element={<About />} />

        <Route path="/play/:matchId" element={<Navigate to="/table/new" replace />} />
        <Route path="/story" element={<Navigate to="/worlds" replace />} />
        <Route path="/story/:chapterId" element={<Navigate to="/worlds" replace />} />
        <Route path="/collection" element={<Navigate to="/studio?tab=builder" replace />} />
        <Route path="/decks" element={<Navigate to="/studio?tab=builder" replace />} />
        <Route path="/decks/:deckId" element={<Navigate to="/studio?tab=builder" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </SentryRoutes>
      <AudioControlsDock />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "paper-panel !rounded-none",
          style: {
            border: "2px solid #121212",
          },
        }}
      />
    </BrowserRouter>
  );
}
