import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function createContext(opts?: { req: Request }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return {
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
