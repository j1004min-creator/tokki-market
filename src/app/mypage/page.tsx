import Link from "next/link";
import { redirect } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { RabbitMascot } from "@/components/rabbit-mascot";
import { signOutAction } from "@/lib/auth-actions";
import { formatWon } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ProductListItem } from "@/lib/types";

export const metadata = { title: "내 토끼굴 · 토끼마켓" };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy 에서 이미 막지만, 서버 컴포넌트에서도 한 번 더 확인한다.
  if (!user) redirect("/login?next=/mypage");

  const [{ data: profile }, { data: selling }, { data: bought }] =
    await Promise.all([
      supabase
        .from("market_profiles")
        .select("nickname, avatar_emoji, region, bio, created_at")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("market_products_view")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(24),
      supabase
        .from("market_products_view")
        .select("*")
        .eq("buyer_id", user.id)
        .order("sold_at", { ascending: false })
        .limit(24),
    ]);

  const myProducts = (selling ?? []) as ProductListItem[];
  const myPurchases = (bought ?? []) as ProductListItem[];

  const onSale = myProducts.filter((product) => product.status !== "sold");
  const soldOut = myProducts.filter((product) => product.status === "sold");
  const soldTotal = soldOut.reduce((sum, product) => sum + product.price, 0);
  const boughtTotal = myPurchases.reduce((sum, product) => sum + product.price, 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="font-cute text-2xl text-ink">내 토끼굴</h1>

      <section className="card-soft mt-4 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-carrot-soft text-4xl">
          {profile?.avatar_emoji ?? "🐰"}
        </span>

        <div className="flex-1">
          <p className="font-cute text-xl text-ink">
            {profile?.nickname ?? "이름 없는 토끼"}
          </p>
          <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {profile?.region ?? "동네 미설정"} ·{" "}
            {profile?.created_at
              ? `${formatDate(profile.created_at)} 가입`
              : "가입일 모름"}
          </p>
        </div>

        <form action={signOutAction}>
          <button type="submit" className="btn-ghost w-full sm:w-auto">
            로그아웃
          </button>
        </form>
      </section>

      {/* 한눈에 보는 숫자 */}
      <dl className="mt-4 grid grid-cols-3 gap-3">
        <div className="card-soft p-4 text-center">
          <dt className="text-xs text-ink-soft">판매중</dt>
          <dd className="mt-1 font-cute text-xl text-ink">{onSale.length}개</dd>
        </div>
        <div className="card-soft p-4 text-center">
          <dt className="text-xs text-ink-soft">판매로 번 돈</dt>
          <dd className="mt-1 font-cute text-xl text-ink">{formatWon(soldTotal)}</dd>
        </div>
        <div className="card-soft p-4 text-center">
          <dt className="text-xs text-ink-soft">구매로 쓴 돈</dt>
          <dd className="mt-1 font-cute text-xl text-ink">
            {formatWon(boughtTotal)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-center text-sm text-ink-soft">
        달마다 나눠 보려면{" "}
        <Link
          href="/ledger"
          className="font-bold text-carrot-deep underline underline-offset-4"
        >
          📒 내 장부
        </Link>
        에서 확인하세요.
      </p>

      <ProductSection
        title="내가 올린 매물"
        emptyText="아직 올린 매물이 없어요. 안 쓰는 물건을 올려 보세요!"
        products={myProducts}
        showSellLink
      />

      <ProductSection
        title="내가 산 물건"
        emptyText="아직 산 물건이 없어요."
        products={myPurchases}
      />
    </div>
  );
}

function ProductSection({
  title,
  emptyText,
  products,
  showSellLink = false,
}: {
  title: string;
  emptyText: string;
  products: ProductListItem[];
  showSellLink?: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-cute text-xl text-ink">{title}</h2>

      {products.length === 0 ? (
        <div className="card-soft mt-3 flex flex-col items-center gap-3 p-8 text-center">
          <RabbitMascot size={56} />
          <p className="text-sm text-ink-soft">{emptyText}</p>
          {showSellLink && (
            <Link href="/products/new" className="btn-carrot">
              매물 올리기
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id} className="flex">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
