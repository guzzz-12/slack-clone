import { createBrowserClient as createClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";

export const supabaseBrowserClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);