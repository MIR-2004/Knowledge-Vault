import { db } from "@/lib/db/client";
import { folder } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const foldersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(folder)
      .where(eq(folder.userId, ctx.user.id))
      .orderBy(folder.name);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        parentId: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const newFolder = await db
        .insert(folder)
        .values({
          id,
          name: input.name,
          userId: ctx.user.id,
          parentId: input.parentId || null,
        })
        .returning();
      return newFolder[0];
    }),

  rename: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedFolder = await db
        .update(folder)
        .set({ name: input.name, updatedAt: new Date() })
        .where(and(eq(folder.id, input.id), eq(folder.userId, ctx.user.id)))
        .returning();
      return updatedFolder[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(folder)
        .where(and(eq(folder.id, input.id), eq(folder.userId, ctx.user.id)));
      return { success: true };
    }),
});
