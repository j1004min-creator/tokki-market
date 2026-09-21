/**
 * 샘플 매물에 사진을 붙이는 스크립트.
 *
 * scripts/sample-images/*.svg 를 PNG 로 바꿔 Supabase Storage 에 올리고,
 * 매물의 image_path 를 채운다.
 *
 * 서비스 키를 쓰지 않고 **실제 계정으로 로그인해서** 올린다.
 * 그래야 Storage 정책(본인 폴더에만 쓰기)과 RLS(내 매물만 수정)를
 * 그대로 통과하는지도 같이 확인된다.
 *
 * 쓰는 법:
 *   node --env-file=.env.local scripts/seed-sample-images.mjs 이메일:비밀번호 [이메일:비밀번호 ...]
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** 매물 제목 → 그림 파일 */
const ART_BY_TITLE = {
  "에어팟 프로 2세대": "airpods",
  "이케아 책상": "desk",
  "접이식 자전거": "bike",
};

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("환경변수가 없어요. --env-file=.env.local 을 붙여 주세요.");
  process.exit(1);
}

const accounts = process.argv.slice(2).map((arg) => {
  const at = arg.indexOf(":");
  if (at < 0) {
    console.error(`계정은 "이메일:비밀번호" 형태로 주세요. 받은 값: ${arg}`);
    process.exit(1);
  }
  return { email: arg.slice(0, at), password: arg.slice(at + 1) };
});

if (accounts.length === 0) {
  console.error("계정을 하나 이상 주세요. 예) node --env-file=.env.local scripts/seed-sample-images.mjs a@b.com:pw");
  process.exit(1);
}

/** SVG 를 800x600 PNG 로 굽는다 */
async function renderPng(name) {
  const svg = await readFile(path.join(HERE, "sample-images", `${name}.svg`));
  return sharp(svg, { density: 200 }).resize(800, 600).png({ quality: 90 }).toBuffer();
}

const pngCache = new Map();
async function getPng(name) {
  if (!pngCache.has(name)) pngCache.set(name, await renderPng(name));
  return pngCache.get(name);
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
    .select("id, title, image_path")
    .eq("seller_id", userId);

  if (listError) {
    console.error(`✗ ${account.email} 매물 조회 실패: ${listError.message}`);
    continue;
  }

  for (const product of products ?? []) {
    const art = ART_BY_TITLE[product.title];
    if (!art) {
      console.log(`- "${product.title}" 은 그림이 없어서 건너뜀`);
      continue;
    }
    if (product.image_path) {
      console.log(`- "${product.title}" 은 이미 사진이 있어서 건너뜀`);
      continue;
    }

    const png = await getPng(art);
    // Storage 정책상 첫 폴더 이름이 내 user id 여야 한다
    const storagePath = `${userId}/sample-${art}-${product.id.slice(0, 8)}.png`;

    const { error: uploadError } = await supabase.storage
      .from("market-images")
      .upload(storagePath, png, { contentType: "image/png", upsert: true });

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

    attached += 1;
    console.log(`✓ "${product.title}" ← ${art}.png`);
  }

  await supabase.auth.signOut();
}

console.log(`\n사진 ${attached}개를 붙였어요 🥕`);
