import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/resume(.*)",
  "/interview(.*)",
  "/ai-cover-letter(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  console.log("Middleware - userId:", userId, "Route:", req.nextUrl.pathname);

  if (!userId && isProtectedRoute(req)) {
    console.log("Middleware - No user found, redirecting to sign-in...");
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (userId && req.nextUrl.pathname.startsWith("/sign-in")) {
    console.log("Middleware - Already signed in, redirecting to dashboard...");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
