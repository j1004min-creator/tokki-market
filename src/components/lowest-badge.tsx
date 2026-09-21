import { CarrotIcon } from "./rabbit-mascot";

/**
 * 최저가 배지.
 * 색만으로 구분하지 않도록 아이콘 + 글자를 함께 쓴다.
 */
export function LowestBadge({ count }: { count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-leaf px-2.5 py-1 text-xs font-bold text-white">
      <CarrotIcon size={13} className="[&_path]:stroke-white" />
      최저가
      {count ? <span className="font-medium opacity-90">/{count}개 중</span> : null}
    </span>
  );
}
