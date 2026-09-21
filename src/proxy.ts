import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { readSupabaseEnv } from "@/lib/supabase/env";

/** 로그인해야 들어갈 수 있는 경로 */
const PROTECTED_PATHS = ["/mypage", "/cart", "/ledger", "/products/new"];
/** 이미 로그인했다면 들어갈 필요가 없는 경로 */
const GUEST_ONLY_PATHS = ["/login", "/signup"];

/**
 * Next.js 16 에서 middleware 는 proxy 로 이름이 바뀌었다.
 * 요청마다 Supabase 세션 쿠키를 갱신해 주는 역할을 한다.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = readSupabaseEnv();

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // getUser() 를 호출해야 만료된 토큰이 갱신된다. 절대 지우지 말 것.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && GUEST_ONLY_PATHS.some((path) => pathname.startsWith(path))) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 정적 파일과 이미지 최적화 요청을 빼고 모든 경로에서 실행한다.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
