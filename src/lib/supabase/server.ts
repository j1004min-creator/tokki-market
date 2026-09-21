import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { readSupabaseEnv } from "./env";

/**
 * 서버(서버 컴포넌트 / 서버 액션 / 라우트 핸들러)에서 쓰는 Supabase 클라이언트.
 * 요청마다 새로 만들어야 한다. 전역 변수에 담아 재사용하면 다른 사용자의
 * 세션이 섞일 수 있다.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = readSupabaseEnv();

  return createServerClient(
    url,
    key,
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
            // 서버 컴포넌트에서는 쿠키를 쓸 수 없다.
            // 세션 갱신은 proxy.ts 가 대신 처리하므로 무시해도 된다.
          }
        },
      },
    },
  );
}
