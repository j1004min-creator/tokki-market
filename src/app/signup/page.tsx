import Link from "next/link";

import { RabbitMascot } from "@/components/rabbit-mascot";

import { SignupForm } from "./signup-form";

export const metadata = { title: "회원가입 · 토끼마켓" };

function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (next?.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

export default async function SignupPage({
  searchParams,
}: PageProps<"/signup">) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <RabbitMascot size={72} happy />
        <h1 className="font-cute text-2xl text-ink">토끼마켓에 온 걸 환영해요</h1>
        <p className="text-sm text-ink-soft">
          30초면 끝나요. 당근 하나 깎는 시간이면 충분해요!
        </p>
      </div>

      <div className="card-soft w-full p-6">
        <SignupForm next={next} />
      </div>

      <p className="text-sm text-ink-soft">
        이미 계정이 있으신가요?{" "}
        <Link
          href={
            next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`
          }
          className="font-bold text-carrot-deep underline underline-offset-4"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
