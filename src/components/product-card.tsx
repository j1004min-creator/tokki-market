import Image from "next/image";
import Link from "next/link";

import { formatRelativeTime, formatWon, productImageUrl } from "@/lib/format";
import type { ProductListItem } from "@/lib/types";

import { LowestBadge } from "./lowest-badge";

export function ProductCard({ product }: { product: ProductListItem }) {
  const imageUrl = productImageUrl(product.image_path);
  const sold = product.status === "sold";

  return (
    <Link
      href={`/products/${product.id}`}
      className="card-soft group flex w-full flex-col overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-4/3 bg-carrot-soft">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 240px"
            className={`object-cover ${sold ? "opacity-40" : ""}`}
          />
        ) : (
          <span className="grid h-full place-items-center text-4xl">
            {product.category_emoji}
          </span>
        )}

        {sold && (
          <span className="absolute inset-0 grid place-items-center bg-ink/45 font-cute text-lg text-white">
            거래완료
          </span>
        )}

        {!sold && product.is_lowest && (
          <span className="absolute top-2 left-2">
            <LowestBadge count={product.same_model_count} />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-ink">
          {product.title}
        </p>
        <p className="font-cute text-lg text-ink">{formatWon(product.price)}</p>
        <p className="mt-auto text-xs text-ink-soft">
          {product.region ? `${product.region} · ` : ""}
          {formatRelativeTime(product.created_at)}
        </p>
      </div>
    </Link>
  );
}
