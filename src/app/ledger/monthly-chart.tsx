"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatWon, formatWonShort, monthLabel, shortMonthLabel } from "@/lib/format";

export type MonthlyPoint = {
  key: string;
  income: number;
  expense: number;
};

const W = 680;
const H = 280;
const PAD_L = 52;
const PAD_R = 14;
const PAD_T = 16;
const PAD_B = 36;

const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const BASE_Y = PAD_T + PLOT_H;

/** 축 눈금이 1·2·5로 떨어지게 올림 */
function niceCeil(value: number): number {
  if (value <= 0) return 10_000;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  const normalized = value / base;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * base;
}

/** 바닥에 붙고 위쪽 모서리만 둥근 막대 */
function barPath(x: number, y: number, width: number): string {
  const height = BASE_Y - y;
  if (height <= 0) return "";
  const r = Math.min(4, height, width / 2);
  return [
    `M${x},${BASE_Y}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${BASE_Y}`,
    "Z",
  ].join(" ");
}

export function MonthlyChart({
  data,
  selectedKey,
}: {
  data: MonthlyPoint[];
  selectedKey: string;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState<number | null>(null);

  const maxValue = Math.max(...data.flatMap((d) => [d.income, d.expense]), 0);
  const top = niceCeil(maxValue);

  const groupW = PLOT_W / data.length;
  const barW = Math.min(26, groupW / 2 - 7);
  const pairW = barW * 2 + 2; // 막대 사이 2px 틈
  const y = (value: number) => BASE_Y - (value / top) * PLOT_H;

  const summary = data
    .map(
      (d) =>
        `${monthLabel(d.key)} 수입 ${formatWon(d.income)}, 지출 ${formatWon(d.expense)}`,
    )
    .join(". ");

  return (
    <figure className="m-0">
      {/* 범례 — 색만으로 구분하지 않도록 이름을 같이 둔다 */}
      <figcaption className="mb-2 flex flex-wrap items-center gap-4 text-sm text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-chart-income" />
          수입 (판매)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-chart-expense" />
          지출 (구매)
        </span>
        <span className="ml-auto text-xs">막대를 누르면 그 달로 이동해요</span>
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`최근 ${data.length}개월 수입과 지출. ${summary}`}
      >
        {/* 가로 눈금선 */}
        {[0, 0.5, 1].map((ratio) => {
          const lineY = BASE_Y - ratio * PLOT_H;
          return (
            <g key={ratio}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={lineY}
                y2={lineY}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
              <text
                x={PAD_L - 8}
                y={lineY + 4}
                textAnchor="end"
                fontSize={11}
                fill="var(--ink-soft)"
              >
                {formatWonShort(Math.round(top * ratio))}
              </text>
            </g>
          );
        })}

        {data.map((point, index) => {
          const groupX = PAD_L + groupW * index;
          const pairX = groupX + (groupW - pairW) / 2;
          const isSelected = point.key === selectedKey;
          const dimmed = hovered !== null && hovered !== index;

          return (
            <g key={point.key} opacity={dimmed ? 0.45 : 1}>
              {isSelected && (
                <rect
                  x={groupX + 2}
                  y={PAD_T}
                  width={groupW - 4}
                  height={PLOT_H}
                  rx={8}
                  fill="var(--carrot-soft)"
                />
              )}

              <path
                d={barPath(pairX, y(point.income), barW)}
                fill="var(--chart-income)"
              />
              <path
                d={barPath(pairX + barW + 2, y(point.expense), barW)}
                fill="var(--chart-expense)"
              />

              <text
                x={groupX + groupW / 2}
                y={BASE_Y + 20}
                textAnchor="middle"
                fontSize={12}
                fontWeight={isSelected ? 700 : 400}
                fill={isSelected ? "var(--ink)" : "var(--ink-soft)"}
              >
                {shortMonthLabel(point.key)}
              </text>
            </g>
          );
        })}

        {/* 바닥선 */}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={BASE_Y}
          y2={BASE_Y}
          stroke="var(--line-strong)"
          strokeWidth={1}
        />

        {/* 마우스 감지 + 클릭 이동 */}
        {data.map((point, index) => (
          <rect
            key={`hit-${point.key}`}
            x={PAD_L + groupW * index}
            y={PAD_T}
            width={groupW}
            height={PLOT_H + PAD_B}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => router.push(`/ledger?month=${point.key}`)}
          >
            <title>{monthLabel(point.key)}</title>
          </rect>
        ))}

        {hovered !== null && <Tooltip point={data[hovered]} index={hovered} groupW={groupW} y={y} />}
      </svg>
    </figure>
  );
}

function Tooltip({
  point,
  index,
  groupW,
  y,
}: {
  point: MonthlyPoint;
  index: number;
  groupW: number;
  y: (value: number) => number;
}) {
  const boxW = 168;
  const boxH = 86;
  const centerX = PAD_L + groupW * index + groupW / 2;

  const x = Math.min(Math.max(centerX - boxW / 2, PAD_L), W - PAD_R - boxW);
  const highestBarY = Math.min(y(point.income), y(point.expense));
  const boxY = Math.max(PAD_T, highestBarY - boxH - 8);

  const net = point.income - point.expense;

  return (
    <g pointerEvents="none">
      <rect
        x={x}
        y={boxY}
        width={boxW}
        height={boxH}
        rx={10}
        fill="var(--card)"
        stroke="var(--line-strong)"
      />
      <text x={x + 12} y={boxY + 20} fontSize={12} fontWeight={700} fill="var(--ink)">
        {monthLabel(point.key)}
      </text>

      <circle cx={x + 17} cy={boxY + 36} r={4} fill="var(--chart-income)" />
      <text x={x + 27} y={boxY + 40} fontSize={12} fill="var(--ink-soft)">
        수입
      </text>
      <text x={x + boxW - 12} y={boxY + 40} fontSize={12} textAnchor="end" fill="var(--ink)">
        {formatWon(point.income)}
      </text>

      <circle cx={x + 17} cy={boxY + 54} r={4} fill="var(--chart-expense)" />
      <text x={x + 27} y={boxY + 58} fontSize={12} fill="var(--ink-soft)">
        지출
      </text>
      <text x={x + boxW - 12} y={boxY + 58} fontSize={12} textAnchor="end" fill="var(--ink)">
        {formatWon(point.expense)}
      </text>

      <text x={x + 12} y={boxY + 76} fontSize={12} fill="var(--ink-soft)">
        순수익
      </text>
      <text x={x + boxW - 12} y={boxY + 76} fontSize={12} fontWeight={700} textAnchor="end" fill="var(--ink)">
        {net >= 0 ? "+" : "−"}
        {formatWon(Math.abs(net))}
      </text>
    </g>
  );
}
