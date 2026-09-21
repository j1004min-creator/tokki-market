import Link from "next/link";

import { RabbitMascot } from "@/components/rabbit-mascot";

import { LoginForm } from "./login-form";

export const metadata = { title: "로그인 · 토끼마켓" };

/** ?next=/mypage 처럼 넘어온 값 중 내부 경로만 받아들인다 */
function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (next?.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <RabbitMascot size={72} />
        <h1 className="font-cute text-2xl text-ink">다시 만나서 반가워요!</h1>
        <p className="text-sm text-ink-soft">
          로그인하고 이웃 토끼들의 매물을 구경해요 🥕
        </p>
      </div>

      <div className="card-soft w-full p-6">
        <LoginForm next={next} />
      </div>

      <p className="text-sm text-ink-soft">
        아직 회원이 아니신가요?{" "}
        <Link
          href={
            next === "/" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`
          }
          className="font-bold text-carrot-deep underline underline-offset-4"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}
