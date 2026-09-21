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
          <span className="font-cute text-xl text-ink">토끼마켓</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/products/new"
            className="rounded-full bg-carrot px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-carrot-deep"
          >
            + 판매하기
          </Link>

          {user ? (
            <>
              <Link
                href="/mypage"
                className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-carrot-soft sm:flex"
              >
                <span aria-hidden="true">{profile?.avatar_emoji ?? "🐰"}</span>
                <span className="max-w-28 truncate">
                  {profile?.nickname ?? "내 토끼굴"}
                </span>
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-carrot-soft hover:text-ink"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-carrot-soft hover:text-ink"
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
