import "server-only";

/**
 * Supabase 접속 정보를 읽는다.
 *
 * 이름에 NEXT_PUBLIC_ 이 붙지 않으므로 이 값들은 **서버에서만** 읽힌다.
 * (Next.js 는 NEXT_PUBLIC_ 이 붙은 변수만 브라우저 번들에 넣어 준다)
 * 우리 앱은 Supabase 를 전부 서버 컴포넌트·서버 액션·proxy 에서만 쓰기 때문에
 * 접두사가 필요 없고, 덕분에 키가 브라우저로 내려가지도 않는다.
 *
 * 나중에 브라우저에서 Supabase 를 직접 써야 한다면 (예: 실시간 구독),
 * 그때는 NEXT_PUBLIC_ 이 붙은 변수를 따로 하나 더 만들어야 한다.
 */

const URL_NAMES = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const;
const KEY_NAMES = [
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

function firstDefined(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

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

/** 매물 사진의 공개 URL. 사진이 없으면 null */
export function productImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { url } = readSupabaseEnv();
  return `${url}/storage/v1/object/public/market-images/${path}`;
}
