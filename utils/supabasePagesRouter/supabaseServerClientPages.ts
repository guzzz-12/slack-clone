// import type { NextApiRequest, NextApiResponse } from "next";
// import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
// import { Database } from "@/types/supabase";

// // Cliente server-side de supabase para el pages-router
// export const supabaseServerClientPages = (req: NextApiRequest, res: NextApiResponse) => {
//   const supabase = createServerClient<Database>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       auth: {
//         detectSessionInUrl: true,
//         flowType: "pkce",
//       },
//       cookies: {
//         getAll() {
//           return Object.keys(req.cookies).map((name) => ({ name, value: req.cookies[name] || "" }))
//         },
//         setAll(cookiesToSet) {
//           res.setHeader(
//             "Set-Cookie",
//             cookiesToSet.map(({ name, value, options }) =>
//               serializeCookieHeader(name, value, options)
//             )
//           )
//         },
//       },
//     }
//   );

//   return supabase
// }