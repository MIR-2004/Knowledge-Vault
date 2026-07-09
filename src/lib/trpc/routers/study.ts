import { db } from "@/lib/db/client";
import { flashcardDeck, flashcard, interviewPrep } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const studyRouter = router({
  listDecks: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(flashcardDeck)
      .where(eq(flashcardDeck.userId, ctx.user.id))
      .orderBy(flashcardDeck.createdAt);
  }),

  getDeck: protectedProcedure
    .input(z.object({ deckId: z.string() }))
    .query(async ({ ctx, input }) => {
      const deck = await db
        .select()
        .from(flashcardDeck)
        .where(and(eq(flashcardDeck.id, input.deckId), eq(flashcardDeck.userId, ctx.user.id)))
        .limit(1);

      if (!deck[0]) return null;

      const cards = await db
        .select()
        .from(flashcard)
        .where(eq(flashcard.deckId, input.deckId))
        .orderBy(flashcard.createdAt);

      return {
        ...deck[0],
        cards,
      };
    }),

  updateCardStatus: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        status: z.enum(["NEW", "LEARNING", "MASTERED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Confirm card belongs to a deck owned by user
      const res = await db
        .select({ cardId: flashcard.id })
        .from(flashcard)
        .innerJoin(flashcardDeck, eq(flashcard.deckId, flashcardDeck.id))
        .where(and(eq(flashcard.id, input.cardId), eq(flashcardDeck.userId, ctx.user.id)))
        .limit(1);

      if (!res[0]) throw new Error("Card not found or unauthorized");

      const updated = await db
        .update(flashcard)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(flashcard.id, input.cardId))
        .returning();

      return updated[0];
    }),

  listInterviews: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(interviewPrep)
      .where(eq(interviewPrep.userId, ctx.user.id))
      .orderBy(interviewPrep.createdAt);
  }),

  getInterview: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await db
        .select()
        .from(interviewPrep)
        .where(and(eq(interviewPrep.id, input.id), eq(interviewPrep.userId, ctx.user.id)))
        .limit(1);
      return res[0] || null;
    }),
});
