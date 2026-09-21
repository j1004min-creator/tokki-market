import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * 메일 인증 링크가 돌아오는 자리.
 * Supabase 가 붙여 주는 code(PKCE) 또는 token_hash(OTP) 를 세션으로 바꾼다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=verify`);
}
