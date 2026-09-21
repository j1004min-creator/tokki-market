import Link from "next/link";
import { redirect } from "next/navigation";

import { RabbitMascot } from "@/components/rabbit-mascot";
import { formatWon, monthKey, monthLabel } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { LedgerEntry } from "@/lib/types";

import { MonthlyChart, type MonthlyPoint } from "./monthly-chart";

export const metadata = { title: "내 장부 · 토끼마켓" };

const MONTHS_IN_CHART = 6;

type SoldRow = {
  id: string;
  title: string;
  price: number;
  sold_at: string;
  seller_id: string;
  buyer_id: string | null;
};

/** "2026-09" 에서 delta 개월 이동 */
function addMonths(key: string, delta: number): string {
  const [year, month] = key.split("-").map(Number);
  return monthKey(new Date(year, month - 1 + delta, 1));
}

function isValidMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export default async function LedgerPage({ searchParams }: PageProps<"/ledger">) {
  const params = await searchParams;
  const requested = Array.isArray(params.month) ? params.month[0] : params.month;
  const thisMonth = monthKey(new Date());
  const selected =
    requested && isValidMonthKey(requested) && requested <= thisMonth
      ? requested
      : thisMonth;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/ledger");

  const { data } = await supabase
    .from("market_products")
    .select("id, title, price, sold_at, seller_id, buyer_id")
    .not("sold_at", "is", null)
    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
    .order("sold_at", { ascending: false })
    .limit(1000);

  const rows = (data ?? []) as SoldRow[];

  // 거래 상대의 닉네임을 한 번에 가져온다
  const counterpartIds = Array.from(
    new Set(
      rows
        .map((row) => (row.seller_id === user.id ? row.buyer_id : row.seller_id))
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const nicknameById = new Map<string, string>();
  if (counterpartIds.length > 0) {
    const { data: profiles } = await supabase
      .from("market_profiles")
      .select("id, nickname")
      .in("id", counterpartIds);

    for (const profile of profiles ?? []) {
      nicknameById.set(profile.id, profile.nickname);
    }
  }

  const entries: LedgerEntry[] = rows.map((row) => {
    const isSeller = row.seller_id === user.id;
    const counterpartId = isSeller ? row.buyer_id : row.seller_id;

    return {
      id: row.id,
      title: row.title,
      price: row.price,
      sold_at: row.sold_at,
      kind: isSeller ? "income" : "expense",
      counterpart: counterpartId
        ? (nicknameById.get(counterpartId) ?? "알 수 없는 토끼")
        : "알 수 없는 토끼",
    };
  });

  // 달별로 모으기
  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const entry of entries) {
    const key = monthKey(new Date(entry.sold_at));
    const bucket = byMonth.get(key) ?? { income: 0, expense: 0 };
    bucket[entry.kind] += entry.price;
    byMonth.set(key, bucket);
  }

  const chartData: MonthlyPoint[] = Array.from(
    { length: MONTHS_IN_CHART },
    (_, index) => {
      const key = addMonths(selected, index - (MONTHS_IN_CHART - 1));
      const bucket = byMonth.get(key) ?? { income: 0, expense: 0 };
      return { key, ...bucket };
    },
  );

  const selectedEntries = entries.filter(
    (entry) => monthKey(new Date(entry.sold_at)) === selected,
  );
  const income = byMonth.get(selected)?.income ?? 0;
  const expense = byMonth.get(selected)?.expense ?? 0;
  const net = income - expense;

  const previousMonth = addMonths(selected, -1);
  const nextMonth = addMonths(selected, 1);
  const canGoNext = nextMonth <= thisMonth;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="font-cute text-2xl text-ink">📒 내 장부</h1>
      <p className="mt-1 text-sm text-ink-soft">
        토끼마켓에서 <strong className="font-semibold text-ink">판 돈은 수입</strong>
        으로, <strong className="font-semibold text-ink">산 돈은 지출</strong>로 달마다
        모아 보여 드려요.
      </p>

      {/* 달 이동 */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <Link
          href={`/ledger?month=${previousMonth}`}
          className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-carrot-soft hover:text-ink"
        >
          ← 이전 달
        </Link>
        <span className="font-cute text-lg text-ink">{monthLabel(selected)}</span>
        {canGoNext ? (
          <Link
            href={`/ledger?month=${nextMonth}`}
            className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-carrot-soft hover:text-ink"
          >
            다음 달 →
          </Link>
        ) : (
          <span className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-line-strong">
            다음 달 →
          </span>
        )}
      </div>

      {/* 이 달 요약 */}
      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="수입 (판매)" value={income} dotClass="bg-chart-income" />
        <StatTile label="지출 (구매)" value={expense} dotClass="bg-chart-expense" />
        <div className="card-soft p-5">
          <dt className="text-sm text-ink-soft">순수익</dt>
          <dd className="mt-1 font-cute text-2xl text-ink">
            {net >= 0 ? "+" : "−"}
            {formatWon(Math.abs(net))}
          </dd>
        </div>
      </dl>

      {/* 차트 */}
      <section className="card-soft mt-4 p-5">
        <h2 className="font-cute text-lg text-ink">최근 {MONTHS_IN_CHART}개월</h2>
        <div className="mt-3">
          <MonthlyChart data={chartData} selectedKey={selected} />
        </div>

        {/* 숫자로도 읽을 수 있게 표를 같이 둔다 */}
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-soft">
              <th className="py-2 font-medium">달</th>
              <th className="py-2 text-right font-medium">수입</th>
              <th className="py-2 text-right font-medium">지출</th>
              <th className="py-2 text-right font-medium">순수익</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((point) => {
              const rowNet = point.income - point.expense;
              return (
                <tr
                  key={point.key}
                  className={`border-b border-line/60 last:border-0 ${
                    point.key === selected
                      ? "font-semibold text-ink"
                      : "text-ink-soft"
                  }`}
                >
                  <td className="py-2">
                    <Link
                      href={`/ledger?month=${point.key}`}
                      className="hover:underline"
                    >
                      {monthLabel(point.key)}
                    </Link>
                  </td>
                  <td className="py-2 text-right">{formatWon(point.income)}</td>
                  <td className="py-2 text-right">{formatWon(point.expense)}</td>
                  <td className="py-2 text-right">
                    {rowNet >= 0 ? "+" : "−"}
                    {formatWon(Math.abs(rowNet))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* 이 달 거래 내역 */}
      <section className="mt-6">
        <h2 className="font-cute text-xl text-ink">
          {monthLabel(selected)} 거래 내역
        </h2>

        {selectedEntries.length === 0 ? (
          <div className="card-soft mt-3 flex flex-col items-center gap-2 p-8 text-center">
            <RabbitMascot size={56} />
            <p className="font-semibold text-ink">이 달엔 거래가 없었어요</p>
            <p className="text-sm text-ink-soft">
              매물을 팔면 수입, 사면 지출로 여기에 쌓여요.
            </p>
          </div>
        ) : (
          <ul className="card-soft mt-3 divide-y divide-line">
            {selectedEntries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 p-4">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
                    entry.kind === "income"
                      ? "bg-chart-income"
                      : "bg-chart-expense"
                  }`}
                  aria-hidden="true"
                >
                  {entry.kind === "income" ? "＋" : "－"}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${entry.id}`}
                    className="block truncate font-semibold text-ink hover:underline"
                  >
                    {entry.title}
                  </Link>
                  <p className="text-xs text-ink-soft">
                    {entry.kind === "income" ? "판매" : "구매"} · {entry.counterpart} ·{" "}
                    {new Date(entry.sold_at).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="font-cute text-lg text-ink">
                  {entry.kind === "income" ? "+" : "−"}
                  {formatWon(entry.price)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  dotClass,
}: {
  label: string;
  value: number;
  dotClass: string;
}) {
  return (
    <div className="card-soft p-5">
      <dt className="flex items-center gap-1.5 text-sm text-ink-soft">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        {label}
      </dt>
      <dd className="mt-1 font-cute text-2xl text-ink">{formatWon(value)}</dd>
    </div>
  );
}
