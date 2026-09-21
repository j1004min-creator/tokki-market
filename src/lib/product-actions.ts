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
    status?: string;
  };
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
/** 판매자가 직접 고를 수 있는 상태. 'sold' 는 구매 함수만 만든다. */
const EDITABLE_STATUSES = ["selling", "reserved"];

type ParsedForm =
  | { ok: true; values: NonNullable<ProductFormState["values"]>; price: number }
  | { ok: false; state: ProductFormState };

/** 등록·수정이 같이 쓰는 입력값 읽기 + 검사 */
function parseProductForm(formData: FormData): ParsedForm {
  const title = String(formData.get("title") ?? "").trim();
  const price = String(formData.get("price") ?? "").replace(/[^0-9]/g, "");
  const category = String(formData.get("category") ?? "");
  const region = String(formData.get("region") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "selling");
  const values = { title, price, category, region, description, status };

  if (title.length < 2 || title.length > 60) {
    return { ok: false, state: { error: "제목은 2~60자로 적어 주세요.", values } };
  }
  if (!category) {
    return { ok: false, state: { error: "카테고리를 골라 주세요.", values } };
  }
  if (!price) {
    return {
      ok: false,
      state: { error: "가격을 입력해 주세요. (나눔이면 0원)", values },
    };
  }
  if (!EDITABLE_STATUSES.includes(status)) {
    return { ok: false, state: { error: "거래 상태가 이상해요.", values } };
  }

  const priceNumber = Number(price);
  if (!Number.isFinite(priceNumber) || priceNumber < 0 || priceNumber > 100_000_000) {
    return {
      ok: false,
      state: { error: "가격은 0원 ~ 1억원 사이로 적어 주세요.", values },
    };
  }

  return { ok: true, values, price: priceNumber };
}

type UploadResult =
  | { ok: true; path: string | null }
  | { ok: false; message: string };

/** 사진이 새로 올라왔으면 내 폴더(user_id/...)에 저장한다 */
async function uploadImage(
  formData: FormData,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<UploadResult> {
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) return { ok: true, path: null };

  if (image.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "사진은 5MB까지 올릴 수 있어요." };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
    return { ok: false, message: "JPG, PNG, WEBP, GIF 사진만 올릴 수 있어요." };
  }

  const extension = image.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("market-images")
    .upload(path, image, { contentType: image.type });

  if (error) return { ok: false, message: `사진을 올리지 못했어요: ${error.message}` };

  return { ok: true, path };
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);
  if (!parsed.ok) return parsed.state;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/products/new");

  const upload = await uploadImage(formData, user.id, supabase);
  if (!upload.ok) return { error: upload.message, values: parsed.values };

  const { data, error } = await supabase
    .from("market_products")
    .insert({
      seller_id: user.id,
      category_slug: parsed.values.category,
      title: parsed.values.title,
      description: parsed.values.description || null,
      price: parsed.price,
      region: parsed.values.region || null,
      image_path: upload.path,
    })
    .select("id")
    .single();

  if (error) {
    // 매물 등록이 실패했으면 올려 둔 사진도 치운다.
    if (upload.path) {
      await supabase.storage.from("market-images").remove([upload.path]);
    }
    return { error: `매물을 올리지 못했어요: ${error.message}`, values: parsed.values };
  }

  revalidatePath("/", "layout");
  redirect(`/products/${data.id}`);
}

export async function updateProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { error: "어떤 매물인지 알 수 없어요." };

  const parsed = parseProductForm(formData);
  if (!parsed.ok) return parsed.state;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/products/${productId}/edit`);

  const { data: existing } = await supabase
    .from("market_products")
    .select("id, seller_id, status, image_path")
    .eq("id", productId)
    .maybeSingle();

  // RLS 가 한 번 더 막아 주지만, 여기서 걸러야 사람이 읽을 메시지를 줄 수 있다.
  if (!existing) return { error: "없는 매물이에요.", values: parsed.values };
  if (existing.seller_id !== user.id) {
    return { error: "내가 올린 매물만 고칠 수 있어요.", values: parsed.values };
  }
  if (existing.status === "sold") {
    return {
      error: "거래가 끝난 매물은 고칠 수 없어요. 장부 기록이 틀어지거든요.",
      values: parsed.values,
    };
  }

  const removeImage = formData.get("removeImage") === "1";
  const upload = await uploadImage(formData, user.id, supabase);
  if (!upload.ok) return { error: upload.message, values: parsed.values };

  // 새 사진 > 사진 지우기 > 그대로 두기
  const nextImagePath = upload.path ?? (removeImage ? null : existing.image_path);

  const { error } = await supabase
    .from("market_products")
    .update({
      category_slug: parsed.values.category,
      title: parsed.values.title,
      description: parsed.values.description || null,
      price: parsed.price,
      region: parsed.values.region || null,
      status: parsed.values.status,
      image_path: nextImagePath,
    })
    .eq("id", productId);

  if (error) {
    if (upload.path) {
      await supabase.storage.from("market-images").remove([upload.path]);
    }
    return { error: `수정하지 못했어요: ${error.message}`, values: parsed.values };
  }

  // 더 이상 쓰지 않는 예전 사진은 보관함에서도 지운다
  if (existing.image_path && existing.image_path !== nextImagePath) {
    await supabase.storage.from("market-images").remove([existing.image_path]);
  }

  revalidatePath("/", "layout");
  redirect(`/products/${productId}`);
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
