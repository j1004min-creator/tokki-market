"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { signInAction, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <FormMessage error={state.error} notice={state.notice} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">이메일</span>
        <input
          className="field"
          type="email"
          name="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          placeholder="rabbit@carrot.com"
          required
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">비밀번호</span>
        <input
          className="field"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••"
          required
        />
      </label>

      <SubmitButton pendingLabel="깡총 들어가는 중…">로그인</SubmitButton>
    </form>
  );
}
