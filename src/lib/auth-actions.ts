"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  notice?: string;
  /** 폼을 다시 그릴 때 입력값을 유지하기 위한 값 */
  values?: { email?: string; nickname?: string };
};

const NICKNAME_RE = /^[가-힣a-zA-Z0-9_]{2,12}$/;

/** 로그인 후 돌아갈 경로. 외부 사이트로 튕기지 않도록 내부 경로만 허용한다. */
function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

/**
 * 가입 직후 "가입이 된 건가?" 싶지 않도록 환영 인사를 띄울 표시를 붙인다.
 * (홈 화면이 welcome=1 을 보고 인사한다)
 */
function withWelcome(target: string): string {
  const [pathname, query] = target.split("?");
  const params = new URLSearchParams(query);
  params.set("welcome", "1");
  return `${pathname}?${params.toString()}`;
}

/** Supabase 가 돌려주는 영어 메시지를 사람이 읽을 말로 바꾼다. */
function toKoreanMessage(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "이메일 또는 비밀번호가 올바르지 않아요.",
    "Email not confirmed": "메일함에서 인증 링크를 먼저 눌러 주세요.",
    "User already registered": "이미 가입된 이메일이에요.",
    "Password should be at least 6 characters.":
      "비밀번호는 6자 이상이어야 해요.",
    "Unable to validate email address: invalid format":
      "이메일 형식이 올바르지 않아요.",
    "For security purposes, you can only request this after 60 seconds.":
      "잠시 후 다시 시도해 주세요. (보안을 위해 60초 제한이 있어요)",
  };
  return map[message] ?? message;
}

export async function signUpAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const nickname = String(formData.get("nickname") ?? "").trim();
  const values = { email, nickname };

  if (!email || !password || !nickname) {
    return { error: "모든 칸을 채워 주세요.", values };
  }
  if (!NICKNAME_RE.test(nickname)) {
    return {
      error: "닉네임은 한글·영문·숫자 2~12자로 지어 주세요.",
      values,
    };
  }
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 해요.", values };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호 확인이 일치하지 않아요.", values };
  }

  const supabase = await createClient();

  // 닉네임 중복은 가입 전에 미리 알려 준다.
  const { data: taken } = await supabase
    .from("market_profiles")
    .select("id")
    .ilike("nickname", nickname)
    .maybeSingle();

  if (taken) {
    return { error: "이미 쓰고 있는 닉네임이에요. 다른 이름은 어때요?", values };
  }

  const origin = (await headers()).get("origin") ?? "";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: toKoreanMessage(error.message), values };
  }

  // 메일 인증이 켜져 있으면 세션이 바로 생기지 않는다.
  if (!data.session) {
    return {
      notice: `${email} 로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요!`,
      values,
    };
  }

  revalidatePath("/", "layout");
  redirect(withWelcome(safeNext(formData.get("next"))));
}

export async function signInAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const values = { email };

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해 주세요.", values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: toKoreanMessage(error.message), values };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
