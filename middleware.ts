import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (xs: CookieToSet[]) =>
          xs.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;

  // Public routes that don't require auth
  const publicPaths = ["/login", "/auth/callback", "/not-authorized"];
  const isPublic = publicPaths.some(p => path.startsWith(p));

  if (!isPublic && !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // For signed-in users: check the allowlist
  if (user?.email && !isPublic) {
    const { data: allowed } = await supabase
      .from("allowed_users")
      .select("email, role")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (!allowed) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/not-authorized", req.url));
    }
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
