export function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

/** 1,234,000 -> "123만원" 같은 짧은 표기 (차트 축·요약용) */
export function formatWonShort(value: number): string {
  if (value === 0) return "0원";
  if (Math.abs(value) >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1).replace(/\.0$/, "")}억원`;
  }
  if (Math.abs(value) >= 10_000) {
    return `${Math.round(value / 10_000).toLocaleString("ko-KR")}만원`;
  }
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;

  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "2026-09" 형태의 달 키 */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  return `${year}년 ${Number(month)}월`;
}

export function shortMonthLabel(key: string): string {
  return `${Number(key.split("-")[1])}월`;
}

/** 매물 사진의 공개 URL. 사진이 없으면 null */
export function productImageUrl(path: string | null): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/market-images/${path}`;
}
