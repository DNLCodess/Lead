// // app/auth/callback/route.js
// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// import { cookies } from "next/headers";
// import { NextResponse } from "next/server";

// export async function GET(request) {
//   const requestUrl = new URL(request.url);
//   const code = requestUrl.searchParams.get("code");
//   const next = requestUrl.searchParams.get("next") || "/dashboard";

//   if (code) {
//     const cookieStore = cookies();
//     const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

//     try {
//       await supabase.auth.exchangeCodeForSession(code);
//     } catch (error) {
//       console.error("Error exchanging code for session:", error);
//       return NextResponse.redirect(
//         `${requestUrl.origin}/login?error=auth_callback_failed`
//       );
//     }
//   }

//   // Redirect to the specified page or dashboard
//   return NextResponse.redirect(`${requestUrl.origin}${next}`);
// }

import React from "react";

const page = () => {
  return <div></div>;
};

export default page;
