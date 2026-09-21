/**
 * Supabase 접속 정보를 읽는다.
 *
 * 이름에 NEXT_PUBLIC_ 이 붙지 않으므로 이 값들은 **서버에서만** 읽힌다.
 * (Next.js 는 NEXT_PUBLIC_ 이 붙은 변수만 브라우저 번들에 넣어 준다)
 * 우리 앱은 Supabase 를 전부 서버 컴포넌트·서버 액션·proxy 에서만 쓰기 때문에
 * 접두사가 필요 없고, 덕분에 키가 브라우저로 내려가지도 않는다.
 *
 * 이 파일은 proxy.ts 도 가져다 쓰므로 "server-only" 를 걸지 않는다.
 * (브라우저에서 절대 쓰면 안 되는 productImageUrl 은 image.ts 에 따로 두었다)
 */

const URL_NAMES = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const;
const KEY_NAMES = [
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

function firstDefined(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

/** 환경변수가 다 있는지만 확인한다 (에러를 던지지 않는다) */
export function hasSupabaseEnv(): boolean {
  return Boolean(firstDefined(URL_NAMES) && firstDefined(KEY_NAMES));
}

/** 화면에 "이 중 하나를 넣어 주세요"라고 알려 주기 위한 목록 */
export const SUPABASE_ENV_NAMES = {
  url: [...URL_NAMES],
  key: [...KEY_NAMES],
};

export function readSupabaseEnv() {
  const url = firstDefined(URL_NAMES);
  const key = firstDefined(KEY_NAMES);

  if (!url || !key) {
    const missing = [
      !url && `주소: ${URL_NAMES.join(" 또는 ")}`,
      !key && `키: ${KEY_NAMES.join(" 또는 ")}`,
    ].filter(Boolean);

    throw new Error(
      `Supabase 환경변수가 없어요. 로컬은 .env.local 에, 배포는 플랫폼의 ` +
        `Environment Variables 설정에 넣어 주세요. 필요한 것 — ${missing.join(" / ")}`,
    );
  }

  return { url, key };
}
