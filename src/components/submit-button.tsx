"use client";

import { useFormStatus } from "react-dom";

/** 폼 전송 중에는 알아서 비활성화되는 버튼 */
export function SubmitButton({
  children,
  pendingLabel = "잠시만요…",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="btn-carrot w-full">
      {pending ? pendingLabel : children}
    </button>
  );
}
