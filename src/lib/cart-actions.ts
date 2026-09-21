"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/products/${productId}`);

  // 이미 담겨 있으면 그대로 둔다 (기본키가 user_id + product_id)
  await supabase
    .from("market_cart_items")
    .upsert({ user_id: user.id, product_id: productId });

  revalidatePath("/", "layout");
}

export async function removeFromCartAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/cart");

  await supabase
    .from("market_cart_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  revalidatePath("/", "layout");
}
