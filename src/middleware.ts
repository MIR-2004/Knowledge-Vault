import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_API_BASE =
  process.env.BETTER_AUTH_URL || "http://localhost:3000";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/dashboard")) {
    try {
      // Use better-auth's session endpoint to verify the session.
      // Forward all cookies so the session token is included.
      const sessionRes = await fetch(`${AUTH_API_BASE}/api/auth/get-session`, {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });

      if (!sessionRes.ok) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const session = await sessionRes.json();

      if (!session?.user) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch {
      // If the session check fails (e.g. cold start), let it through
      // and let the client-side auth handle it.
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
