// Server-side Supabase client for Server Components, Server Actions, and Route Handlers.
// Uses the browser anon key + the user's session cookie. RLS applies.
//
// Reference: https://supabase.com/docs/guides/auth/server-side/nextjs (latest @supabase/ssr pattern)

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components can't set cookies; ignore. The middleware client
            // is responsible for refreshing sessions on every request.
          }
        },
      },
    }
  );
}
