import { db } from "@/lib/db/client";
import { note } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const notesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        folderId: z.string().optional().nullable(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      let query = db
        .select()
        .from(note)
        .where(eq(note.userId, ctx.user.id));

      if (input?.folderId) {
        query = db
          .select()
          .from(note)
          .where(and(eq(note.userId, ctx.user.id), eq(note.folderId, input.folderId)));
      }

      return query.orderBy(note.updatedAt);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(note)
        .where(and(eq(note.id, input.id), eq(note.userId, ctx.user.id)))
        .limit(1);
      return result[0] || null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string(),
        folderId: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const newNote = await db
        .insert(note)
        .values({
          id,
          title: input.title,
          content: input.content,
          userId: ctx.user.id,
          folderId: input.folderId || null,
        })
        .returning();
      return newNote[0];
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        folderId: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Partial<typeof note.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.folderId !== undefined) updateData.folderId = input.folderId;

      const updatedNote = await db
        .update(note)
        .set(updateData)
        .where(and(eq(note.id, input.id), eq(note.userId, ctx.user.id)))
        .returning();
      return updatedNote[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(note)
        .where(and(eq(note.id, input.id), eq(note.userId, ctx.user.id)));
      return { success: true };
    }),
});
