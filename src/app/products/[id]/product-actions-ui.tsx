"use client";

import { addToCartAction, removeFromCartAction } from "@/lib/cart-actions";
import { formatWon } from "@/lib/format";
import { buyProductAction, deleteProductAction } from "@/lib/product-actions";

/** 되돌릴 수 없는 동작이라 한 번 더 묻는다 */
function confirmOrCancel(event: React.FormEvent<HTMLFormElement>, message: string) {
  if (!window.confirm(message)) event.preventDefault();
}

export function BuyButton({
  productId,
  price,
  title,
}: {
  productId: string;
  price: number;
  title: string;
}) {
  return (
    <form
      action={buyProductAction}
      onSubmit={(event) =>
        confirmOrCancel(
          event,
          `"${title}"을(를) ${formatWon(price)}에 구매할까요?\n구매하면 거래완료로 바뀌고 내 장부에 지출로 기록돼요.`,
        )
      }
    >
      <input type="hidden" name="productId" value={productId} />
      <button type="submit" className="btn-carrot w-full">
        바로 구매하기
      </button>
    </form>
  );
}

export function CartToggleButton({
  productId,
  inCart,
}: {
  productId: string;
  inCart: boolean;
}) {
  return (
    <form action={inCart ? removeFromCartAction : addToCartAction}>
      <input type="hidden" name="productId" value={productId} />
      <button type="submit" className="btn-ghost w-full">
        {inCart ? "🛒 장바구니에서 빼기" : "🛒 장바구니에 담기"}
      </button>
    </form>
  );
}

export function DeleteProductButton({ productId }: { productId: string }) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(event) =>
        confirmOrCancel(event, "이 매물을 지울까요? 되돌릴 수 없어요.")
      }
    >
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        className="w-full rounded-full border border-rose/40 bg-rose-soft px-4 py-2.5 font-semibold text-rose transition-colors hover:bg-rose hover:text-white"
      >
        매물 삭제
      </button>
    </form>
  );
}
