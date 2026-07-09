"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, Award, Loader2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function FlashcardsPage() {
  const utils = trpc.useUtils();

  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Queries
  const { data: decks = [], isLoading: decksLoading } = trpc.study.listDecks.useQuery();
  const { data: activeDeck, isLoading: deckLoading } = trpc.study.getDeck.useQuery(
    { deckId: activeDeckId || "" },
    { enabled: !!activeDeckId }
  );

  // Mutations
  const updateCardStatus = trpc.study.updateCardStatus.useMutation({
    onSuccess: () => {
      utils.study.getDeck.invalidate({ deckId: activeDeckId || "" });
    },
  });

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (!activeDeck) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % activeDeck.cards.length);
  };

  const handlePrev = () => {
    if (!activeDeck) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + activeDeck.cards.length) % activeDeck.cards.length);
  };

  const handleMarkStatus = (cardId: string, status: "LEARNING" | "MASTERED") => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    if (status === "MASTERED") {
      // Fire congratulations confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#D6BD98", "#677D6A", "#40534C"],
      });
    }
    updateCardStatus.mutate({ cardId, status });
    // Auto advance to next card after a short delay
    setTimeout(() => {
      handleNext();
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto flex-1 flex flex-col h-full overflow-hidden select-none space-y-6">
      {/* Top Header */}
      <div className="border-b border-border/30 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" /> Spaced-Repetition Flashcards
        </h1>
        <p className="text-xs text-foreground/80 mt-1">
          Review facts dynamically. Correctly answered cards are flagged as Mastered.
        </p>
      </div>

      {/* Grid: Decks List vs Study Arena */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Left: Decks lists */}
        <div className="md:col-span-1 border border-border/20 bg-card/20 rounded-lg p-4 flex flex-col overflow-hidden h-[450px]">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 border-b border-border/20 pb-2">
            AI Study Decks
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {decksLoading ? (
              <div className="text-center text-xs text-foreground/40 py-8">Loading decks...</div>
            ) : decks.length === 0 ? (
              <div className="text-center text-xs text-foreground/40 py-8 leading-relaxed">
                No flashcard decks found.<br />Open a Note or PDF and click &quot;Generate Flashcards&quot; to begin.
              </div>
            ) : (
              decks.map((deck) => (
                <div
                  key={deck.id}
                  onClick={() => {
                    setActiveDeckId(deck.id);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    activeDeckId === deck.id
                      ? "bg-secondary text-primary border-primary/40"
                      : "bg-background/40 hover:bg-card/40 border-border/10 hover:border-border/30"
                  }`}
                >
                  <h3 className="text-xs font-bold truncate text-foreground mb-1">{deck.title}</h3>
                  <span className="text-[9px] text-foreground/60 font-mono">
                    Created: {new Date(deck.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Study Carousel Arena */}
        <div className="md:col-span-2 border border-border/20 bg-card/10 rounded-lg overflow-hidden flex flex-col h-[450px]">
          {activeDeckId ? (
            deckLoading || !activeDeck ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-foreground/60 mt-2">Loading cards...</p>
              </div>
            ) : activeDeck.cards.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-foreground/50">
                <Brain className="h-10 w-10 text-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-primary">Empty Deck</p>
                <p className="text-xs text-foreground/60 mt-1">This deck contains no flashcards.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6 justify-between overflow-hidden">
                {/* Deck progress header */}
                <div className="flex items-center justify-between border-b border-border/15 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-foreground">{activeDeck.title}</h2>
                    <p className="text-[10px] text-foreground/60 mt-0.5">
                      Card {currentCardIndex + 1} of {activeDeck.cards.length}
                    </p>
                  </div>
                  {/* Mastery stats */}
                  <div className="flex gap-2">
                    <Badge variant="gold" className="text-[9px] font-bold">
                      Mastered: {activeDeck.cards.filter((c) => c.status === "MASTERED").length}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] font-bold">
                      Learning: {activeDeck.cards.filter((c) => c.status === "LEARNING").length}
                    </Badge>
                  </div>
                </div>

                {/* Study card space */}
                <div className="flex-1 flex items-center justify-center py-6">
                  {/* Card Container */}
                  <div
                    onClick={handleFlip}
                    className="w-full max-w-md h-52 cursor-pointer flip-card"
                  >
                    <div
                      className={`flip-card-inner ${
                        isFlipped ? "flip-card-flipped" : ""
                      }`}
                    >
                      {/* Front Side */}
                      <div className="flip-card-front">
                        <span className="text-[9px] text-primary font-bold uppercase tracking-wider mb-2">
                          Question / Term
                        </span>
                        <p className="text-sm font-bold text-center leading-relaxed">
                          {activeDeck.cards[currentCardIndex].front}
                        </p>
                        <span className="text-[9px] text-foreground/50 mt-6 flex items-center gap-1.5">
                          <RefreshCw className="h-3 w-3" /> Click to reveal answer
                        </span>
                      </div>

                      {/* Back Side */}
                      <div className="flip-card-back">
                        <span className="text-[9px] text-primary font-bold uppercase tracking-wider mb-2">
                          Answer / Concept
                        </span>
                        <p className="text-xs font-medium text-center leading-relaxed max-h-[120px] overflow-y-auto">
                          {activeDeck.cards[currentCardIndex].back}
                        </p>
                        <span className="text-[9px] text-foreground/50 mt-6 flex items-center gap-1.5">
                          <RefreshCw className="h-3 w-3" /> Click to flip back
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Study card controls footer */}
                <div className="flex flex-col gap-4 border-t border-border/15 pt-4">
                  {/* Study assessment buttons */}
                  <div className="flex justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleMarkStatus(
                          activeDeck.cards[currentCardIndex].id,
                          "LEARNING"
                        )
                      }
                      disabled={isTransitioning}
                      className="text-xs font-semibold gap-1.5 hover:border-yellow-500/40 hover:text-yellow-300"
                    >
                      Still learning
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleMarkStatus(
                          activeDeck.cards[currentCardIndex].id,
                          "MASTERED"
                        )
                      }
                      disabled={isTransitioning}
                      className="text-xs font-bold gap-1.5"
                    >
                      <CheckCircle className="h-4 w-4" /> Mastered!
                    </Button>
                  </div>

                  {/* Carousel navigation buttons */}
                  <div className="flex justify-between items-center text-xs">
                    <Button variant="ghost" size="sm" onClick={handlePrev} disabled={isTransitioning}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous Card
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-foreground/60 font-semibold uppercase">
                        Current Card status:
                      </span>
                      <Badge
                        variant={
                          activeDeck.cards[currentCardIndex].status === "MASTERED"
                            ? "gold"
                            : activeDeck.cards[currentCardIndex].status === "LEARNING"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[9px] font-bold"
                      >
                        {activeDeck.cards[currentCardIndex].status}
                      </Badge>
                    </div>

                    <Button variant="ghost" size="sm" onClick={handleNext} disabled={isTransitioning}>
                      Next Card <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-foreground/50">
              <Brain className="h-12 w-12 text-foreground/30 animate-pulse mb-3" />
              <p className="text-sm font-semibold text-primary">No Deck Selected</p>
              <p className="text-xs text-foreground/60 mt-1 max-w-xs">
                Select a flashcard deck from the study list on the left to start your spaced-repetition session.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
