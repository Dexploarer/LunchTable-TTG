import { GuildDashboard } from "@/components/guilds/GuildDashboard";
import { NoGuildView } from "@/components/guilds/NoGuildView";
import { useGuildInteraction } from "@/hooks/guilds/useGuildInteraction";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Shield } from "lucide-react";

export const Route = createFileRoute("/_app/guilds")({
  component: GuildsPage,
});

function GuildsPage() {
  const { isAuthenticated, isLoading, hasGuild, dashboard, discovery } = useGuildInteraction();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 rounded-xl bg-card border border-border">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-xl font-bold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to view guilds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 max-w-6xl">
      {hasGuild ? <GuildDashboard dashboard={dashboard} /> : <NoGuildView discovery={discovery} />}
    </div>
  );
}
