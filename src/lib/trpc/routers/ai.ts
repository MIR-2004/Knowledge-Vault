import { db } from "@/lib/db/client";
import { note, pdfDocument, flashcardDeck, flashcard, interviewPrep } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
  summarizeNoteOrPdf,
  explainDifficultConcepts,
  generateFlashcardsFromText,
  generateInterviewQuestionsFromText,
  gradeInterviewAnswer,
} from "@/lib/anthropic";


// Get the text from DB of the note or pdf 
async function getContentSource(userId: string, noteId?: string | null, pdfId?: string | null) {
    if (noteId) {
        const res = await db.select().from(note).where(and(eq(note.id, noteId), eq(note.userId, userId))).limit(1);
        if (!res[0]) throw new Error("Note not found");

        return { title: res[0].title, text: res[0].content };
    } else if (pdfId) {
        const res = await db.select().from(pdfDocument).where(and(eq(pdfDocument.id, pdfId), eq(pdfDocument.userId, userId))).limit(1);
        if (!res[0]) throw new Error("PDF Document not found");
        return { title: res[0].name, text: res[0].extractedText || "Empty document content." };
    }
    throw new Error("Missing content source ID");
}


export const aiRouter = router({
  summarize: protectedProcedure
    .input(
      z.object({
        noteId: z.string().optional().nullable(),
        pdfId: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const source = await getContentSource(ctx.user.id, input.noteId, input.pdfId);
      const summary = await summarizeNoteOrPdf(source.title, source.text);
      return { summary };
    }),

  explain: protectedProcedure
    .input(
      z.object({
        noteId: z.string().optional().nullable(),
        pdfId: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const source = await getContentSource(ctx.user.id, input.noteId, input.pdfId);
      const explanation = await explainDifficultConcepts(source.title, source.text);
      return { explanation };
    }),

  generateFlashcards: protectedProcedure
    .input(
      z.object({
        noteId: z.string().optional().nullable(),
        pdfId: z.string().optional().nullable(),
        deckTitle: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const source = await getContentSource(ctx.user.id, input.noteId, input.pdfId);
      const rawCards = await generateFlashcardsFromText(source.title, source.text);

      const deckId = crypto.randomUUID();
      const newDeck = await db
        .insert(flashcardDeck)
        .values({
          id: deckId,
          title: input.deckTitle,
          noteId: input.noteId || null,
          pdfId: input.pdfId || null,
          userId: ctx.user.id,
        })
        .returning();

      if (rawCards.length > 0) {
        const cardsToInsert = rawCards.map((card) => ({
          id: crypto.randomUUID(),
          deckId: deckId,
          front: card.front,
          back: card.back,
          status: "NEW",
        }));
        await db.insert(flashcard).values(cardsToInsert);
      }

      return { deck: newDeck[0], cardCount: rawCards.length };
    }),

  generateInterviewQuestions: protectedProcedure
    .input(
      z.object({
        noteId: z.string().optional().nullable(),
        pdfId: z.string().optional().nullable(),
        sessionTitle: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const source = await getContentSource(ctx.user.id, input.noteId, input.pdfId);
      const questions = await generateInterviewQuestionsFromText(source.title, source.text);

      const interviewId = crypto.randomUUID();
      const newSession = await db
        .insert(interviewPrep)
        .values({
          id: interviewId,
          title: input.sessionTitle,
          noteId: input.noteId || null,
          pdfId: input.pdfId || null,
          userId: ctx.user.id,
          questionsJson: JSON.stringify(questions),
        })
        .returning();

      return { interview: newSession[0], questions };
    }),

  submitInterviewAnswer: protectedProcedure
    .input(
      z.object({
        interviewId: z.string(),
        questionId: z.string(),
        userAnswer: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const res = await db
        .select()
        .from(interviewPrep)
        .where(and(eq(interviewPrep.id, input.interviewId), eq(interviewPrep.userId, ctx.user.id)))
        .limit(1);

      if (!res[0]) throw new Error("Interview prep session not found");
      const session = res[0];

      interface Question {
        id: string;
        question: string;
        sampleAnswer: string;
        userAnswer?: string;
        feedback?: string;
        score?: number;
      }

      const questions = JSON.parse(session.questionsJson) as Question[];
      const qIndex = questions.findIndex((q) => q.id === input.questionId);
      if (qIndex === -1) throw new Error("Question not found in this session");

      const question = questions[qIndex];

      const grading = await gradeInterviewAnswer(
        question.question,
        question.sampleAnswer,
        input.userAnswer
      );

      questions[qIndex] = {
        ...question,
        userAnswer: input.userAnswer,
        feedback: grading.feedback,
        score: grading.score,
      };

      await db
        .update(interviewPrep)
        .set({ questionsJson: JSON.stringify(questions), updatedAt: new Date() })
        .where(eq(interviewPrep.id, input.interviewId));

      return { gradedQuestion: questions[qIndex] };
    }),
});
