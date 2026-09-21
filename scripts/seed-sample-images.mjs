/**
 * 샘플 매물에 사진을 붙이는 스크립트.
 *
 * Unsplash 사진을 받아 800x600 으로 잘라 Supabase Storage 에 올리고,
 * 매물의 image_path 를 채운다. 사진 출처는 sample-images/CREDITS.md 참고.
 *
 * 서비스 키를 쓰지 않고 **실제 계정으로 로그인해서** 올린다.
 * 그래야 Storage 정책(본인 폴더에만 쓰기)과 RLS(내 매물만 수정)를
 * 그대로 통과하는지도 같이 확인된다.
 *
 * 쓰는 법:
 *   node --env-file=.env.local scripts/seed-sample-images.mjs 이메일:비밀번호 [이메일:비밀번호 ...]
 *
 * 이미 사진이 있어도 다시 덮어쓴다. (--keep 을 주면 있는 건 건너뛴다)
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const UNSPLASH = "https://images.unsplash.com";

/**
 * 어떤 매물에 어떤 사진을 붙일지.
 * 같은 "에어팟 프로 2세대" 라도 판매자마다 다른 사진이 걸리도록 가격으로 구분한다.
 */
const PHOTOS = [
  { title: "에어팟 프로 2세대", price: 139000, id: "photo-1572569511254-d8f925fe2cbb" },
  { title: "에어팟 프로 2세대", price: 158000, id: "photo-1606741965326-cb990ae01bb2" },
  { title: "에어팟 프로 2세대", price: 129000, id: "photo-1590658268037-6bf12165a8df" },
  { title: "이케아 책상", price: 35000, id: "photo-1611269154421-4e27233ac5c7" },
  { title: "접이식 자전거", price: 90000, id: "photo-1719885959196-03139e36d22c" },
];

const keepExisting = process.argv.includes("--keep");

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("환경변수가 없어요. --env-file=.env.local 을 붙여 주세요.");
  process.exit(1);
}

const accounts = process.argv
  .slice(2)
  .filter((arg) => !arg.startsWith("--"))
  .map((arg) => {
    const at = arg.indexOf(":");
    if (at < 0) {
      console.error(`계정은 "이메일:비밀번호" 형태로 주세요. 받은 값: ${arg}`);
      process.exit(1);
    }
    return { email: arg.slice(0, at), password: arg.slice(at + 1) };
  });

if (accounts.length === 0) {
  console.error(
    "계정을 하나 이상 주세요. 예) node --env-file=.env.local scripts/seed-sample-images.mjs a@b.com:pw",
  );
  process.exit(1);
}

/** 사진을 받아 매물 카드 비율(4:3)로 잘라 JPEG 으로 만든다 */
async function fetchPhoto(id) {
  const response = await fetch(`${UNSPLASH}/${id}?w=1600&h=1200&fit=crop&q=85&fm=jpg`);
  if (!response.ok) {
    throw new Error(`사진을 받지 못했어요 (${response.status}) ${id}`);
  }
  const original = Buffer.from(await response.arrayBuffer());
  return sharp(original)
    .resize(800, 600, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

let attached = 0;

for (const account of accounts) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: auth, error: signInError } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });

  if (signInError) {
    console.error(`✗ ${account.email} 로그인 실패: ${signInError.message}`);
    continue;
  }

  const userId = auth.user.id;

  const { data: products, error: listError } = await supabase
    .from("market_products")
    .select("id, title, price, image_path")
    .eq("seller_id", userId);

  if (listError) {
    console.error(`✗ ${account.email} 매물 조회 실패: ${listError.message}`);
    continue;
  }

  for (const product of products ?? []) {
    const match = PHOTOS.find(
      (photo) => photo.title === product.title && photo.price === product.price,
    );
    if (!match) {
      console.log(`- "${product.title}" (${product.price}원) 은 정해 둔 사진이 없어 건너뜀`);
      continue;
    }
    if (product.image_path && keepExisting) {
      console.log(`- "${product.title}" 은 이미 사진이 있어서 건너뜀`);
      continue;
    }

    let photo;
    try {
      photo = await fetchPhoto(match.id);
    } catch (error) {
      console.error(`✗ "${product.title}" ${error.message}`);
      continue;
    }

    // Storage 정책상 첫 폴더 이름이 내 user id 여야 한다.
    // 파일 이름에 사진 번호를 넣어, 사진을 바꾸면 경로도 바뀌게 한다.
    // (같은 경로에 덮어쓰면 브라우저와 이미지 최적화 캐시가 옛 사진을 계속 보여 준다)
    const photoTag = match.id.replace("photo-", "").slice(0, 10);
    const storagePath = `${userId}/sample-${product.id.slice(0, 8)}-${photoTag}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("market-images")
      .upload(storagePath, photo, { contentType: "image/jpeg", upsert: true });

    if (uploadError) {
      console.error(`✗ "${product.title}" 사진 업로드 실패: ${uploadError.message}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("market_products")
      .update({ image_path: storagePath })
      .eq("id", product.id);

    if (updateError) {
      console.error(`✗ "${product.title}" image_path 저장 실패: ${updateError.message}`);
      continue;
    }

    // 예전에 올려 둔 그림이 남아 있으면 치운다
    if (product.image_path && product.image_path !== storagePath) {
      await supabase.storage.from("market-images").remove([product.image_path]);
    }

    attached += 1;
    console.log(
      `✓ "${product.title}" (${product.price.toLocaleString("ko-KR")}원) ← ${match.id} · ${Math.round(photo.length / 1024)}KB`,
    );
  }

  await supabase.auth.signOut();
}

console.log(`\n사진 ${attached}장을 붙였어요 🥕`);
