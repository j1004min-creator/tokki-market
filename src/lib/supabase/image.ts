import "server-only";

import { readSupabaseEnv } from "./env";

/**
 * 매물 사진의 공개 URL. 사진이 없으면 null.
 *
 * 서버 전용이다. 클라이언트 컴포넌트에서 이 파일을 가져다 쓰면
 * "server-only" 가 빌드를 실패시켜 알려 준다.
 */
export function productImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { url } = readSupabaseEnv();
  return `${url}/storage/v1/object/public/market-images/${path}`;
}
