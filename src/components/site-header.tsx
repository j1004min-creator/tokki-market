import Link from "next/link";

import { signOutAction } from "@/lib/auth-actions";
import { createClient } from "@/lib/supabase/server";

import { NavTabs } from "./nav-tabs";
import { RabbitMascot } from "./rabbit-mascot";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { nickname: string; avatar_emoji: string } | null = null;
  let cartCount = 0;

  if (user) {
    const [profileResult, cartResult] = await Promise.all([
      supabase
        .from("market_profiles")
        .select("nickname, avatar_emoji")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("market_cart_items")
        .select("product_id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    profile = profileResult.data;
    cartCount = cartResult.count ?? 0;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-carrot-soft">
            <RabbitMascot size={30} />
          </span>
          <span className="font-cute text-xl whitespace-nowrap text-ink">
            토끼마켓
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/products/new"
            className="rounded-full bg-carrot px-3 py-1.5 text-sm font-bold whitespace-nowrap text-white transition-colors hover:bg-carrot-deep sm:px-4"
          >
            <span className="sm:hidden">+ 판매</span>
            <span className="hidden sm:inline">+ 판매하기</span>
          </Link>

          {user ? (
            <>
              {/* 좁은 화면에서도 로그인한 상태가 보이도록 이모지는 늘 띄운다 */}
              <Link
                href="/mypage"
                className="flex items-center gap-2 rounded-full border border-line px-2.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-carrot-soft sm:px-3"
              >
                <span aria-hidden="true">{profile?.avatar_emoji ?? "🐰"}</span>
                <span className="hidden max-w-28 truncate sm:block">
                  {profile?.nickname ?? "내 토끼굴"}
                </span>
                <span className="sr-only">내 토끼굴</span>
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap text-ink-soft transition-colors hover:bg-carrot-soft hover:text-ink sm:px-3"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap text-ink-soft transition-colors hover:bg-carrot-soft hover:text-ink sm:px-3"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="hidden rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-carrot-soft sm:block"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>

      <NavTabs cartCount={cartCount} />
    </header>
  );
}
