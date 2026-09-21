import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

import { ProductForm } from "./product-form";

export const metadata = { title: "매물 등록 · 토끼마켓" };

export default async function NewProductPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/products/new");

  const { data: categories } = await supabase
    .from("market_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="font-cute text-2xl text-ink">매물 올리기</h1>
      <p className="mt-1 text-sm text-ink-soft">
        안 쓰는 물건, 이웃 토끼에게 보내 주세요 🥕
      </p>

      <div className="card-soft mt-5 p-6">
        <ProductForm categories={(categories ?? []) as Category[]} />
      </div>
    </div>
  );
}
