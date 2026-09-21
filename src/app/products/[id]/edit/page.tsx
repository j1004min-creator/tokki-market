import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProductForm } from "@/components/product-form";
import { productImageUrl } from "@/lib/supabase/image";
import { updateProductAction } from "@/lib/product-actions";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export const metadata = { title: "매물 수정 · 토끼마켓" };

export default async function EditProductPage({
  params,
}: PageProps<"/products/[id]/edit">) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/products/${id}/edit`);

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("market_products")
      .select(
        "id, seller_id, title, description, price, region, status, image_path, category_slug",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("market_categories")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  if (!product) notFound();

  // 내 매물이 아니면 그냥 상세로 돌려보낸다
  if (product.seller_id !== user.id) redirect(`/products/${id}`);

  if (product.status === "sold") {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10 text-center">
        <h1 className="font-cute text-2xl text-ink">이미 거래가 끝났어요</h1>
        <p className="mt-2 text-sm text-ink-soft">
          거래완료된 매물은 고칠 수 없어요. 장부에 남은 기록이 틀어지거든요.
        </p>
        <Link href={`/products/${id}`} className="btn-carrot mt-5 inline-flex">
          매물로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <Link
        href={`/products/${id}`}
        className="text-sm font-semibold text-ink-soft hover:text-ink"
      >
        ← 매물로 돌아가기
      </Link>

      <h1 className="mt-3 font-cute text-2xl text-ink">매물 고치기</h1>
      <p className="mt-1 text-sm text-ink-soft">
        가격을 내리거나 설명을 다듬어 보세요 ✏️
      </p>

      <div className="card-soft mt-5 p-6">
        <ProductForm
          action={updateProductAction}
          categories={(categories ?? []) as Category[]}
          productId={product.id}
          currentImageUrl={productImageUrl(product.image_path)}
          defaultValues={{
            title: product.title,
            price: String(product.price),
            category: product.category_slug,
            region: product.region ?? "",
            description: product.description ?? "",
            status: product.status,
          }}
          submitLabel="저장하기"
          pendingLabel="고치는 중…"
          cancelHref={`/products/${id}`}
        />
      </div>
    </div>
  );
}
