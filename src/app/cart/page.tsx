import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LowestBadge } from "@/components/lowest-badge";
import { RabbitMascot } from "@/components/rabbit-mascot";
import { removeFromCartAction } from "@/lib/cart-actions";
import { formatWon } from "@/lib/format";
import { productImageUrl } from "@/lib/supabase/image";
import { buyProductAction } from "@/lib/product-actions";
import { createClient } from "@/lib/supabase/server";
import type { ProductListItem } from "@/lib/types";

export const metadata = { title: "장바구니 · 토끼마켓" };

type CartRow = { created_at: string; product: ProductListItem | null };

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/cart");

  const { data } = await supabase
    .from("market_cart_items")
    .select("created_at, product:market_products_view(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = ((data ?? []) as unknown as CartRow[]).filter(
    (row): row is { created_at: string; product: ProductListItem } =>
      row.product !== null,
  );

  const available = rows.filter((row) => row.product.status !== "sold");
  const total = available.reduce((sum, row) => sum + row.product.price, 0);
  const lowestCount = available.filter((row) => row.product.is_lowest).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="font-cute text-2xl text-ink">🛒 장바구니</h1>
      <p className="mt-1 text-sm text-ink-soft">
        마음에 든 매물을 담아 두고 값을 비교해 보세요.
      </p>

      {rows.length === 0 ? (
        <div className="card-soft mt-5 flex flex-col items-center gap-3 p-10 text-center">
          <RabbitMascot size={72} />
          <p className="font-semibold text-ink">장바구니가 비었어요</p>
          <p className="text-sm text-ink-soft">
            매물 상세 화면에서 &quot;장바구니에 담기&quot;를 눌러 보세요.
          </p>
          <Link href="/" className="btn-carrot">
            매물 구경하러 가기
          </Link>
        </div>
      ) : (
        <>
          <ul className="card-soft mt-5 divide-y divide-line">
            {rows.map(({ product }) => {
              const imageUrl = productImageUrl(product.image_path);
              const sold = product.status === "sold";

              return (
                <li key={product.id} className="flex items-center gap-3 p-4">
                  <Link
                    href={`/products/${product.id}`}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-carrot-soft"
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="64px"
                        className={`object-cover ${sold ? "opacity-40" : ""}`}
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-2xl">
                        {product.category_emoji}
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${product.id}`}
                      className="block truncate font-semibold text-ink hover:underline"
                    >
                      {product.title}
                    </Link>
                    <p className="font-cute text-lg text-ink">
                      {formatWon(product.price)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {sold ? (
                        <span className="rounded-full bg-line px-2 py-0.5 text-xs font-semibold text-ink-soft">
                          거래완료
                        </span>
                      ) : (
                        product.is_lowest && (
                          <LowestBadge count={product.same_model_count} />
                        )
                      )}
                      <span className="text-xs text-ink-soft">
                        {product.seller_emoji} {product.seller_nickname}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1.5">
                    {!sold && product.seller_id !== user.id && (
                      <form action={buyProductAction}>
                        <input
                          type="hidden"
                          name="productId"
                          value={product.id}
                        />
                        <button
                          type="submit"
                          className="w-full rounded-full bg-carrot px-3 py-1.5 text-xs font-bold text-white hover:bg-carrot-deep"
                        >
                          구매
                        </button>
                      </form>
                    )}
                    <form action={removeFromCartAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="w-full rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-rose-soft hover:text-rose"
                      >
                        빼기
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="card-soft mt-4 flex flex-wrap items-center justify-between gap-2 p-5">
            <div>
              <p className="text-sm text-ink-soft">
                담아 둔 매물 {available.length}개 합계
                {lowestCount > 0 && ` · 그중 최저가 ${lowestCount}개`}
              </p>
              <p className="font-cute text-2xl text-ink">{formatWon(total)}</p>
            </div>
            <p className="text-xs text-ink-soft">
              구매는 매물별로 눌러 주세요. 한 번에 결제하는 기능은 아직이에요 🐰
            </p>
          </div>
        </>
      )}
    </div>
  );
}
