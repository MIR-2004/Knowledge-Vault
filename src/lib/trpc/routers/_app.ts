import { router } from "../trpc";
import { foldersRouter } from "./folders";
import { notesRouter } from "./notes";
import { studyRouter } from "./study";
import { aiRouter } from "./ai";
import { pdfsRouter } from "./pdfs";

export const appRouter = router({
  folders: foldersRouter,
  notes: notesRouter,
  study: studyRouter,
  ai: aiRouter,
  pdfs: pdfsRouter,
});

export type AppRouter = typeof appRouter;
