import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormMessage } from "@/components/form-message";
import { LowestBadge } from "@/components/lowest-badge";
import { formatRelativeTime, formatWon, productImageUrl } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ProductListItem } from "@/lib/types";

import {
  BuyButton,
  CartToggleButton,
  DeleteProductButton,
} from "./product-actions-ui";

const STATUS_LABEL: Record<string, string> = {
  selling: "판매중",
  reserved: "예약중",
  sold: "거래완료",
};

export default async function ProductDetailPage({
  params,
  searchParams,
}: PageProps<"/products/[id]">) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  const [{ data: product }, { data: userData }] = await Promise.all([
    supabase.from("market_products_view").select("*").eq("id", id).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!product) notFound();

  const item = product as ProductListItem;
  const user = userData.user;
  const isMine = user?.id === item.seller_id;
  const isSold = item.status === "sold";
  const isReserved = item.status === "reserved";
  const imageUrl = productImageUrl(item.image_path);

  // 같은 물건의 다른 매물 (가격 낮은 순)
  const { data: siblings } = await supabase
    .from("market_products_view")
    .select("*")
    .eq("model_key", item.model_key ?? "")
    .neq("id", item.id)
    .eq("status", "selling")
    .order("price", { ascending: true })
    .limit(5);

  const sameModel = (siblings ?? []) as ProductListItem[];

  let inCart = false;
  if (user) {
    const { data: cartRow } = await supabase
      .from("market_cart_items")
      .select("product_id")
      .eq("user_id", user.id)
      .eq("product_id", item.id)
      .maybeSingle();
    inCart = Boolean(cartRow);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link href="/" className="text-sm font-semibold text-ink-soft hover:text-ink">
        ← 목록으로
      </Link>

      {query.error === "buy" && (
        <div className="mt-3">
          <FormMessage error="이미 거래가 끝났거나 살 수 없는 매물이에요." />
        </div>
      )}
      {query.bought === "1" && (
        <div className="mt-3">
          <FormMessage notice="구매했어요! 내 장부에 지출로 기록됐어요." />
        </div>
      )}

      <article className="card-soft mt-3 overflow-hidden">
        <div className="relative aspect-video bg-carrot-soft">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className={`object-cover ${isSold ? "opacity-40" : ""}`}
              priority
            />
          ) : (
            <span className="grid h-full place-items-center text-6xl">
              {item.category_emoji}
            </span>
          )}

          {isSold && (
            <span className="absolute inset-0 grid place-items-center bg-ink/45 font-cute text-3xl text-white">
              거래완료
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-carrot-soft px-2.5 py-1 text-xs font-semibold text-carrot-deep">
              {item.category_emoji} {item.category_label}
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-ink-soft">
              {STATUS_LABEL[item.status]}
            </span>
            {!isSold && item.is_lowest && (
              <LowestBadge count={item.same_model_count} />
            )}
          </div>

          <div>
            <h1 className="font-cute text-2xl text-ink">{item.title}</h1>
            <p className="mt-1 font-cute text-3xl text-carrot-deep">
              {formatWon(item.price)}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {item.region ? `${item.region} · ` : ""}
              {formatRelativeTime(item.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-2 border-y border-line py-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-carrot-soft text-lg">
              {item.seller_emoji}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">
                {item.seller_nickname}
              </p>
              <p className="text-xs text-ink-soft">판매자</p>
            </div>
          </div>

          {item.description && (
            <p className="text-ink whitespace-pre-wrap">{item.description}</p>
          )}

          {/* 액션 */}
          {isSold ? (
            <p className="rounded-xl bg-carrot-soft px-4 py-3 text-center text-sm font-semibold text-carrot-deep">
              거래가 끝난 매물이에요
            </p>
          ) : isMine ? (
            <div className="flex flex-col gap-2">
              <p className="rounded-xl bg-carrot-soft px-4 py-3 text-center text-sm font-semibold text-carrot-deep">
                내가 올린 매물이에요
                {isReserved && " · 지금은 예약중이라 아무도 살 수 없어요"}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row [&>*]:flex-1">
                <Link href={`/products/${item.id}/edit`} className="btn-ghost">
                  ✏️ 매물 수정
                </Link>
                <DeleteProductButton productId={item.id} />
              </div>
            </div>
          ) : user ? (
            <div className="flex flex-col gap-2">
              {isReserved && (
                <p className="rounded-xl bg-carrot-soft px-4 py-3 text-center text-sm font-semibold text-carrot-deep">
                  판매자가 예약중으로 바꿔 둔 매물이에요. 장바구니에 담아 두고
                  기다려 보세요.
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row [&>form]:flex-1">
                <CartToggleButton productId={item.id} inCart={inCart} />
                {!isReserved && (
                  <BuyButton
                    productId={item.id}
                    price={item.price}
                    title={item.title}
                  />
                )}
              </div>
            </div>
          ) : (
            <Link
              href={`/login?next=/products/${item.id}`}
              className="btn-carrot w-full"
            >
              로그인하고 거래하기
            </Link>
          )}
        </div>
      </article>

      {/* 같은 물건 비교 */}
      {sameModel.length > 0 && (
        <section className="mt-6">
          <h2 className="font-cute text-xl text-ink">같은 물건 다른 매물</h2>
          <p className="mt-1 text-sm text-ink-soft">
            제목이 같은 매물끼리 묶어서 싼 순으로 보여 드려요.
          </p>
          <ul className="card-soft mt-3 divide-y divide-line">
            {sameModel.map((sibling) => (
              <li key={sibling.id}>
                <Link
                  href={`/products/${sibling.id}`}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-carrot-soft"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-carrot-soft text-lg">
                    {sibling.category_emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {sibling.seller_nickname}
                    </span>
                    <span className="block text-xs text-ink-soft">
                      {sibling.region ?? "동네 미설정"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {sibling.is_lowest && <LowestBadge />}
                    <span className="font-cute text-lg text-ink">
                      {formatWon(sibling.price)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
