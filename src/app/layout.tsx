import type { Metadata } from "next";
import { Jua, Noto_Sans_KR } from "next/font/google";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

/*
 * 한글 글립프까지 받으려면 subsets 를 지정하지 않고 preload 를 끈다.
 * (subsets: ["latin"] 로 두면 한글이 빠진 파일만 내려온다)
 */
const jua = Jua({
  weight: "400",
  variable: "--font-cute",
  display: "swap",
  preload: false,
});

const notoSansKr = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "토끼마켓 — 당근보다 귀여운 중고거래",
  description:
    "관심 있는 중고 매물을 한눈에, 최저가는 콕 집어서. 토끼마켓에서 폴짝 거래하세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${jua.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line px-4 py-6 text-center text-sm text-ink-soft">
          🥕 토끼마켓 · 공부하면서 한 단계씩 만들어 가는 중고거래 마켓
        </footer>
      </body>
    </html>
  );
}
