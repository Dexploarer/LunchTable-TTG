import { LibraryCard } from "@/components/deck/LibraryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Save, Search, Trash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Types
interface DeckCardEntry {
  cardDefinitionId: Id<"cardDefinitions">;
  quantity: number;
  card: any; // Full card definition
}

export const Route = createFileRoute("/_app/decks/builder/$deckId")({
  component: DeckBuilderPage,
});

function DeckBuilderPage() {
  const { deckId } = Route.useParams() as { deckId: Id<"userDecks"> };
  const navigate = useNavigate();

  // Data Fetching
  const deckData = useQuery((api as any).lunchtable_tcg_cards.decks.getDeckWithCards, { deckId });
  const allCards = useQuery(api.lunchtable_tcg_cards.cards.getAllCards);

  // Mutations
  const saveDeck = useMutation((api as any).lunchtable_tcg_cards.decks.saveDeck);
  const renameDeck = useMutation((api as any).lunchtable_tcg_cards.decks.renameDeck);

  // Local State
  const [deckName, setDeckName] = useState("");
  const [currentDeck, setCurrentDeck] = useState<DeckCardEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state when data loads
  useEffect(() => {
    if (deckData) {
      setDeckName(deckData.name);
      // Transform initial deck data to local state
      const initialCards = deckData.cards.map((c: any) => ({
        cardDefinitionId: c.cardDefinitionId,
        quantity: c.quantity,
        card: c, // We have the full card definition here
      }));
      setCurrentDeck(initialCards);
    }
  }, [deckData]);

  // Derived State
  const totalCards = currentDeck.reduce((sum, c) => sum + c.quantity, 0);

  const filteredLibrary = useMemo(() => {
    if (!allCards) return [];
    return allCards.filter((card: any) => {
      const matchesSearch = card.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "all" || card.cardType === filterType;
      return matchesSearch && matchesType;
    });
  }, [allCards, search, filterType]);

  // Handlers
  const handleAddCard = (card: any) => {
    if (totalCards >= 60) {
      toast.error("Deck limit reached (60 cards)");
      return;
    }

    setCurrentDeck((prev) => {
      const existing = prev.find((c) => c.cardDefinitionId === card._id);
      if (existing) {
        if (existing.quantity >= 3) {
          toast.error("Max 3 copies per card");
          return prev;
        }
        return prev.map((c) =>
          c.cardDefinitionId === card._id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { cardDefinitionId: card._id, quantity: 1, card }];
    });
  };

  const handleRemoveCard = (cardId: string) => {
    setCurrentDeck((prev) => {
      const existing = prev.find((c) => c.cardDefinitionId === cardId);
      if (!existing) return prev;

      if (existing.quantity > 1) {
        return prev.map((c) =>
          c.cardDefinitionId === cardId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.cardDefinitionId !== cardId);
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Rename if changed
      if (deckData && deckName !== deckData.name) {
        await renameDeck({ deckId, name: deckName });
      }

      // 2. Save Cards
      await saveDeck({
        deckId,
        cards: currentDeck.map((c) => ({
          cardDefinitionId: c.cardDefinitionId,
          quantity: c.quantity,
        })),
      });

      toast.success("Deck saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save deck");
    } finally {
      setIsSaving(false);
    }
  };

  if (!deckData || !allCards) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-background z-10">
        <div className="flex items-center gap-4 flex-1">
          <Input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="text-xl font-bold w-full max-w-sm border-none shadow-none focus-visible:ring-1"
          />
          <div className="flex gap-2 text-sm font-mono text-muted-foreground">
            <span
              className={cn(
                totalCards < 30
                  ? "text-yellow-600"
                  : totalCards > 60
                    ? "text-red-600"
                    : "text-green-600"
              )}
            >
              {totalCards}
            </span>
            / 60 Cards
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: ".." })}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Deck
          </Button>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Library */}
        <div className="w-1/2 flex flex-col border-r bg-muted/10">
          {/* Filters */}
          <div className="p-4 flex gap-2 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search collection..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="stereotype">Stereotype</SelectItem>
                <SelectItem value="spell">Spell</SelectItem>
                <SelectItem value="trap">Trap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Library Grid */}
          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredLibrary.map((card: any) => {
                const inDeck =
                  currentDeck.find((c) => c.cardDefinitionId === card._id)?.quantity || 0;
                return (
                  <div key={card._id} className="flex justify-center">
                    <LibraryCard
                      card={card}
                      size="sm"
                      onClick={() => handleAddCard(card)}
                      count={inDeck}
                    />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Deck List */}
        <div className="w-1/2 flex flex-col bg-background">
          <div className="p-4 border-b font-bold uppercase tracking-wide text-sm flex justify-between">
            <span>Current List</span>
            <span className="text-muted-foreground">Sort: Type</span>
          </div>

          <ScrollArea className="flex-1 p-4">
            {currentDeck.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <div className="w-16 h-24 border-2 border-dashed border-current rounded mb-2" />
                <p>Drag or click cards to add them</p>
              </div>
            ) : (
              <div className="space-y-1">
                {currentDeck.map((entry) => (
                  <div
                    key={entry.cardDefinitionId}
                    className="group flex items-center gap-3 p-2 rounded hover:bg-muted/50 border border-transparent hover:border-border transition-colors cursor-pointer"
                    onClick={() => handleRemoveCard(entry.cardDefinitionId)}
                  >
                    <div className="font-mono font-bold bg-black text-white px-2 py-0.5 rounded text-xs">
                      x{entry.quantity}
                    </div>
                    <div className="flex-1 font-bold text-sm uppercase">{entry.card.name}</div>
                    <div className="text-xs text-muted-foreground uppercase">
                      {entry.card.cardType}
                    </div>
                    <div className="font-mono text-xs w-6 text-center">{entry.card.cost}</div>
                    <div className="opacity-0 group-hover:opacity-100 text-red-500">
                      <Trash className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
