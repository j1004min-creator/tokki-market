/**
 * Supabase 접속 정보를 읽는다.
 * 없으면 "무슨 변수를 어디에 넣어야 하는지"를 알려 주고 멈춘다.
 * (빌드가 아니라 실행 시점에 확인한다 — 빌드 설정은 환경변수에 기대면 안 된다)
 */
export function readSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 없어요. NEXT_PUBLIC_SUPABASE_URL 과 " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY 를 로컬은 .env.local 에, " +
        "배포는 플랫폼의 Environment Variables 설정에 넣어 주세요.",
    );
  }

  return { url, key };
}
