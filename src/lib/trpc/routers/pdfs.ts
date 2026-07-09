import { db } from "@/lib/db/client";
import { pdfDocument } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const pdfsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        folderId: z.string().optional().nullable(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      let query = db
        .select()
        .from(pdfDocument)
        .where(eq(pdfDocument.userId, ctx.user.id));

      if (input?.folderId) {
        query = db
          .select()
          .from(pdfDocument)
          .where(and(eq(pdfDocument.userId, ctx.user.id), eq(pdfDocument.folderId, input.folderId)));
      }

      return query.orderBy(pdfDocument.createdAt);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Fetch details to delete the file eventually, but database deletion is clean
      await db
        .delete(pdfDocument)
        .where(and(eq(pdfDocument.id, input.id), eq(pdfDocument.userId, ctx.user.id)));
      return { success: true };
    }),
});
