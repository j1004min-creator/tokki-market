import { RabbitMascot } from "@/components/rabbit-mascot";
import { SUPABASE_ENV_NAMES } from "@/lib/supabase/env";

/**
 * Supabase 환경변수가 없을 때 보여 주는 화면.
 *
 * 이게 없으면 모든 페이지가 그냥 "Internal Server Error" 로 떨어져서
 * 무엇이 빠졌는지 알 길이 없다.
 */
export function SetupNotice() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
      <RabbitMascot size={88} />
      <h1 className="font-cute text-2xl text-ink">
        아직 Supabase 연결 설정이 안 됐어요
      </h1>
      <p className="text-sm text-ink-soft">
        환경변수 두 개가 필요해요. 로컬이면 <code>.env.local</code> 에, 배포라면
        플랫폼의 Environment Variables 설정에 넣고{" "}
        <strong className="font-semibold text-ink">다시 배포</strong>해 주세요.
        (환경변수는 빌드할 때 주입돼서, 넣기만 하면 반영되지 않아요)
      </p>

      <dl className="card-soft w-full p-5 text-left text-sm">
        <dt className="font-semibold text-ink">프로젝트 주소</dt>
        <dd className="mt-1 text-ink-soft">
          {SUPABASE_ENV_NAMES.url.map((name) => (
            <code key={name} className="mr-2 inline-block">
              {name}
            </code>
          ))}
          <span className="block text-xs">중 아무 이름이나 괜찮아요</span>
        </dd>

        <dt className="mt-4 font-semibold text-ink">공개 키 (anon / publishable)</dt>
        <dd className="mt-1 text-ink-soft">
          {SUPABASE_ENV_NAMES.key.map((name) => (
            <code key={name} className="mr-2 inline-block">
              {name}
            </code>
          ))}
          <span className="block text-xs">중 아무 이름이나 괜찮아요</span>
        </dd>
      </dl>

      <p className="text-xs text-ink-soft">
        값은 Supabase 대시보드 → Project Settings → API 에서 복사할 수 있어요.
      </p>
    </div>
  );
}
