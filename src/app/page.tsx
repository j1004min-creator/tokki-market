import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { RabbitMascot } from "@/components/rabbit-mascot";
import { createClient } from "@/lib/supabase/server";
import type { Category, ProductListItem } from "@/lib/types";

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const category = firstParam(params.category);
  const query = firstParam(params.q).trim();
  const justSignedUp = firstParam(params.welcome) === "1";

  const supabase = await createClient();

  let listQuery = supabase
    .from("market_products_view")
    .select("*")
    .neq("status", "sold")
    .order("created_at", { ascending: false })
    .limit(60);

  if (category) listQuery = listQuery.eq("category_slug", category);
  if (query) listQuery = listQuery.ilike("title", `%${query}%`);

  const [{ data: categories }, { data: products }, { data: userData }] =
    await Promise.all([
      supabase
        .from("market_categories")
        .select("*")
        .order("sort_order", { ascending: true }),
      listQuery,
      supabase.auth.getUser(),
    ]);

  const categoryList = (categories ?? []) as Category[];
  const productList = (products ?? []) as ProductListItem[];
  const lowestCount = productList.filter((p) => p.is_lowest).length;

  // 가입 직후에만 닉네임을 불러와 인사한다
  let welcomeNickname: string | null = null;
  if (justSignedUp && userData.user) {
    const { data } = await supabase
      .from("market_profiles")
      .select("nickname")
      .eq("id", userData.user.id)
      .maybeSingle();
    welcomeNickname = data?.nickname ?? null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      {welcomeNickname && (
        <section className="card-soft mb-6 flex items-center gap-4 border-leaf/30 bg-leaf-soft p-5">
          <RabbitMascot size={56} happy className="shrink-0" />
          <div>
            <p className="font-cute text-lg text-ink">
              가입 완료! 환영해요, {welcomeNickname}님 🥕
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              이제 매물을 사고팔 수 있어요. 오른쪽 위{" "}
              <strong className="font-semibold text-ink">＋ 판매하기</strong>로 첫
              매물을 올려 보세요.
            </p>
          </div>
        </section>
      )}

      {!userData.user && (
        <section className="card-soft mb-6 flex items-center gap-4 bg-linear-to-br from-carrot-soft to-card p-5">
          <RabbitMascot size={64} happy className="shrink-0" />
          <div>
            <p className="font-cute text-lg text-ink">
              당근보다 귀여운 중고거래, 토끼마켓
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              구경은 그냥 하셔도 돼요. 사거나 팔려면{" "}
              <Link
                href="/signup"
                className="font-bold text-carrot-deep underline underline-offset-4"
              >
                회원가입
              </Link>
              이 필요해요.
            </p>
          </div>
        </section>
      )}

      {/* 검색 */}
      <form className="flex gap-2" action="/">
        {category && <input type="hidden" name="category" value={category} />}
        <input
          className="field flex-1"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="어떤 물건을 찾으세요? 🥕"
        />
        <button type="submit" className="btn-carrot px-5">
          검색
        </button>
      </form>

      {/* 카테고리 */}
      <nav className="mt-4 -mx-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-2 pb-1">
          <li>
            <CategoryChip
              href={query ? `/?q=${encodeURIComponent(query)}` : "/"}
              active={!category}
              emoji="🥕"
              label="전체"
            />
          </li>
          {categoryList.map((item) => {
            const search = new URLSearchParams({ category: item.slug });
            if (query) search.set("q", query);

            return (
              <li key={item.slug}>
                <CategoryChip
                  href={`/?${search.toString()}`}
                  active={category === item.slug}
                  emoji={item.emoji}
                  label={item.label}
                />
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 목록 */}
      <section className="mt-6">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-cute text-xl text-ink">
            {query
              ? `"${query}" 검색 결과`
              : category
                ? `${categoryList.find((c) => c.slug === category)?.label ?? ""} 매물`
                : "방금 올라온 매물"}
          </h2>
          {lowestCount > 0 && (
            <p className="text-sm text-ink-soft">
              같은 물건 중 제일 싼 매물 {lowestCount}개에 🥕최저가 배지를 달았어요
            </p>
          )}
        </div>

        {productList.length === 0 ? (
          <div className="card-soft mt-4 flex flex-col items-center gap-3 p-10 text-center">
            <RabbitMascot size={72} />
            <p className="font-semibold text-ink">
              {query || category
                ? "조건에 맞는 매물이 아직 없어요"
                : "아직 올라온 매물이 없어요"}
            </p>
            <p className="text-sm text-ink-soft">
              첫 매물을 올려 보실래요? 안 쓰는 물건이 누군가에겐 보물이에요.
            </p>
            <Link href="/products/new" className="btn-carrot">
              매물 올리기
            </Link>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {productList.map((product) => (
              <li key={product.id} className="flex">
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CategoryChip({
  href,
  active,
  emoji,
  label,
}: {
  href: string;
  active: boolean;
  emoji: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
        active
          ? "border-carrot bg-carrot text-white"
          : "border-line bg-card text-ink hover:bg-carrot-soft"
      }`}
    >
      <span aria-hidden="true">{emoji}</span>
      {label}
    </Link>
  );
}
