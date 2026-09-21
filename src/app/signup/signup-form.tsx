"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { signUpAction, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = {};

export function SignupForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signUpAction, initialState);

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
        <span className="text-sm font-semibold text-ink">닉네임</span>
        <input
          className="field"
          type="text"
          name="nickname"
          autoComplete="nickname"
          defaultValue={state.values?.nickname}
          placeholder="당근토끼"
          maxLength={12}
          required
        />
        <span className="text-xs text-ink-soft">
          한글·영문·숫자 2~12자. 이웃 토끼들에게 보이는 이름이에요.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">비밀번호</span>
        <input
          className="field"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="6자 이상"
          minLength={6}
          required
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">비밀번호 확인</span>
        <input
          className="field"
          type="password"
          name="passwordConfirm"
          autoComplete="new-password"
          placeholder="한 번 더 입력해 주세요"
          minLength={6}
          required
        />
      </label>

      <SubmitButton pendingLabel="토끼굴 파는 중…">가입하기</SubmitButton>
    </form>
  );
}
