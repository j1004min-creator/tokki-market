"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ProductFormState = {
  error?: string;
  values?: {
    title?: string;
    price?: string;
    category?: string;
    region?: string;
    description?: string;
  };
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").replace(/[^0-9]/g, "");
  const category = String(formData.get("category") ?? "");
  const region = String(formData.get("region") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const values = { title, price: priceRaw, category, region, description };

  if (title.length < 2 || title.length > 60) {
    return { error: "제목은 2~60자로 적어 주세요.", values };
  }
  if (!category) {
    return { error: "카테고리를 골라 주세요.", values };
  }
  if (!priceRaw) {
    return { error: "가격을 입력해 주세요. (나눔이면 0원)", values };
  }

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0 || price > 100_000_000) {
    return { error: "가격은 0원 ~ 1억원 사이로 적어 주세요.", values };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/products/new");

  // 사진은 선택. 올렸다면 내 폴더(user.id/...)에 저장한다.
  let imagePath: string | null = null;
  const image = formData.get("image");

  if (image instanceof File && image.size > 0) {
    if (image.size > MAX_IMAGE_BYTES) {
      return { error: "사진은 5MB까지 올릴 수 있어요.", values };
    }
    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      return { error: "JPG, PNG, WEBP, GIF 사진만 올릴 수 있어요.", values };
    }

    const extension = image.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("market-images")
      .upload(path, image, { contentType: image.type });

    if (uploadError) {
      return { error: `사진을 올리지 못했어요: ${uploadError.message}`, values };
    }
    imagePath = path;
  }

  const { data, error } = await supabase
    .from("market_products")
    .insert({
      seller_id: user.id,
      category_slug: category,
      title,
      description: description || null,
      price,
      region: region || null,
      image_path: imagePath,
    })
    .select("id")
    .single();

  if (error) {
    // 매물 등록이 실패했으면 올려 둔 사진도 치운다.
    if (imagePath) {
      await supabase.storage.from("market-images").remove([imagePath]);
    }
    return { error: `매물을 올리지 못했어요: ${error.message}`, values };
  }

  revalidatePath("/", "layout");
  redirect(`/products/${data.id}`);
}

export async function deleteProductAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 사진 경로를 먼저 알아 둔다 (행이 지워지면 못 찾는다)
  const { data: product } = await supabase
    .from("market_products")
    .select("image_path, seller_id")
    .eq("id", productId)
    .maybeSingle();

  // RLS 가 한 번 더 막아 주지만, 미리 확인해서 헛수고를 줄인다.
  if (!product || product.seller_id !== user.id) redirect("/mypage");

  await supabase.from("market_products").delete().eq("id", productId);

  if (product.image_path) {
    await supabase.storage.from("market-images").remove([product.image_path]);
  }

  revalidatePath("/", "layout");
  redirect("/mypage");
}

export async function buyProductAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/products/${productId}`);

  const { error } = await supabase.rpc("market_buy_product", {
    p_product_id: productId,
  });

  revalidatePath("/", "layout");

  if (error) {
    redirect(`/products/${productId}?error=buy`);
  }
  redirect(`/products/${productId}?bought=1`);
}
