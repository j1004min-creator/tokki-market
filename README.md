# 🐰 토끼마켓

당근과 토끼를 테마로 한 중고거래 마켓. **공부용으로 한 단계씩** 만들어 갑니다.

- 프레임워크: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- 백엔드: Supabase (가계부 앱과 **같은 프로젝트**, 테이블은 `market_` 접두사로 분리)

## 화면

| 경로 | 설명 |
| --- | --- |
| `/` | 홈. 매물 목록 + 검색 + 카테고리 필터, 최저가 배지 |
| `/products/new` | 매물 등록 (사진 · 제목 · 카테고리 · 가격 · 동네 · 설명) |
| `/products/[id]` | 매물 상세. 장바구니 담기 / 구매하기 / 같은 물건 값 비교 |
| `/products/[id]/edit` | 매물 수정. 판매자 본인만, 거래완료 전까지 |
| `/cart` | 🛒 장바구니 탭. 담아 둔 매물 합계와 최저가 표시 |
| `/ledger` | 📒 내 장부. 달마다 수입(판매)·지출(구매)과 6개월 차트 |
| `/mypage` | 내 토끼굴. 프로필, 내가 올린 매물, 내가 산 물건 |
| `/signup` `/login` | 회원가입 / 로그인 (`?next=` 로 원래 가려던 곳 복귀) |
| `/auth/callback` | 메일 인증 링크가 돌아오는 자리 |

## 1단계 (완료): 회원가입 / 로그인 / 로그아웃

- 가입하면 DB 트리거가 `market_profiles` 행을 자동으로 만든다 (닉네임 중복이면 숫자를 붙임)
- 세션은 쿠키에 저장되고, 요청마다 `proxy.ts` 가 `getUser()` 로 토큰을 갱신한다
- 로그인이 필요한 경로(`/mypage`, `/cart`, `/ledger`, `/products/new`)는 `proxy.ts` 가 막는다

## 2단계 (완료): 매물 CRUD · 장바구니 · 내 장부

**매물 CRUD**

| | 어디서 | 누가 |
| --- | --- | --- |
| Create | `/products/new` | 로그인한 사람 |
| Read | `/`, `/products/[id]` | 누구나 (로그인 없이도 구경 가능) |
| Update | `/products/[id]/edit` | 올린 사람만, 거래완료 전까지 |
| Delete | 상세 화면의 "매물 삭제" | 올린 사람만 |

등록과 수정은 `src/components/product-form.tsx` 하나를 같이 씁니다. 서버 액션만
바꿔 끼우는 구조라, 검사 규칙이 한 곳(`parseProductForm`)에 모여 있습니다.

수정할 때 **판매중 ↔ 예약중**을 바꿀 수 있습니다. 예약중이면 구매 버튼이 사라지고
최저가 배지 후보에서도 빠집니다. 거래완료된 매물은 수정할 수 없습니다 — 가격을 고치면
장부에 남은 기록이 틀어지기 때문입니다.

사진을 새로 올리면 예전 사진은 보관함에서도 지웁니다.


**최저가는 어떻게 고르나**
제목에서 공백과 기호를 지우고 소문자로 만든 `model_key` 로 같은 물건을 묶는다
(생성 컬럼). `market_products_view` 가 그 묶음 안에서 판매중인 것들의 최저가를 구해
`is_lowest` 로 알려 준다. 같은 물건이 2개 이상일 때만 배지를 단다.

**거래와 장부**
매물을 사면 `market_buy_product()` 함수가 `status='sold'`, `buyer_id`, `sold_at` 을 채운다.
`/ledger` 는 그 기록으로 **판 것 = 수입 / 산 것 = 지출** 을 달마다 모아서 보여 준다.
차트 색(수입 `#6f9b57` / 지출 `#b5477b`)은 색각이상에서도 구분되는지 검사해서 고른 조합이다.

### 코드 지도

```
src/
├─ proxy.ts                  # Next 16의 미들웨어. 세션 갱신 + 접근 제어
├─ lib/
│  ├─ supabase/client.ts     # 브라우저용 Supabase 클라이언트
│  ├─ supabase/server.ts     # 서버용 (요청마다 새로 생성)
│  ├─ auth-actions.ts        # 가입/로그인/로그아웃 서버 액션
│  ├─ product-actions.ts     # 매물 등록/삭제/구매 서버 액션
│  ├─ cart-actions.ts        # 장바구니 담기/빼기
│  ├─ format.ts              # 원 표기, 상대 시간, 달 키
│  └─ types.ts               # 화면에서 쓰는 행 타입
├─ components/               # 마스코트 SVG, 헤더·탭, 매물 카드, 최저가 배지
└─ app/                      # 페이지들
```

> **주의**: Next.js 16부터 `middleware.ts` 가 `proxy.ts` 로 이름이 바뀌었습니다.

## 개발 환경

```bash
npm install
npm run dev
```

`.env.local` 이 필요합니다 (`.env.example` 참고).

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx
```

> **`NEXT_PUBLIC_` 접두사가 없는 이유**
> Next.js 는 `NEXT_PUBLIC_` 이 붙은 변수만 브라우저 번들에 넣어 줍니다.
> 이 앱은 Supabase 를 서버 컴포넌트·서버 액션·`proxy.ts` 에서만 쓰기 때문에
> 접두사가 필요 없고, 덕분에 키가 브라우저로 내려가지도 않습니다.
> `src/lib/supabase/env.ts` 는 `import "server-only"` 로 막아 두어서,
> 실수로 클라이언트 컴포넌트에서 가져다 쓰면 **빌드가 실패하며 알려 줍니다.**
> 나중에 브라우저에서 Supabase 를 직접 써야 하면 (예: 실시간 구독)
> 그때 `NEXT_PUBLIC_` 변수를 따로 하나 더 만들어야 합니다.

배포 플랫폼(Vercel 등)에서도 같은 두 변수를 Environment Variables 에 넣고
**다시 배포**해야 합니다. 환경변수는 빌드할 때 주입되기 때문입니다.

> 이 PC에서는 node가 PATH에 안 잡힐 수 있습니다. 그럴 땐 PowerShell에서
> `$env:PATH = "C:\Program Files\nodejs;" + $env:PATH` 를 먼저 실행하세요.

## 데이터베이스

`supabase/migrations/` 에 적용한 SQL을 순서대로 남겨 둡니다. 원격 DB에는 이미 적용돼 있습니다.

| 이름 | 설명 |
| --- | --- |
| `market_profiles` | 사용자 프로필 (auth.users 와 1:1) |
| `market_categories` | 카테고리 10종 |
| `market_products` | 매물. `model_key` 생성 컬럼으로 같은 물건을 묶음 |
| `market_cart_items` | 장바구니 (user_id + product_id) |
| `market_products_view` | 목록용 뷰. 판매자·카테고리·최저가 여부 포함 |
| `market_buy_product()` | 구매 처리 함수 (로그인한 사용자만 호출 가능) |
| `market-images` | 매물 사진 버킷. 읽기 공개, 쓰기는 본인 폴더만 |

모든 테이블에 RLS를 켜 뒀습니다. Supabase 보안 린트가 `market_buy_product` 를
"로그인 사용자가 호출 가능한 SECURITY DEFINER 함수"라고 경고하는데, **의도한 대로**입니다.
구매는 원래 로그인한 사람이 호출해야 하고, 조건 검사는 함수 안에서 합니다.

## 다음 단계 계획

- [ ] 3단계: 찜하기 ❤️ 와 관심 카테고리 맞춤 피드
- [ ] 4단계: 판매자와 채팅
- [ ] 5단계: 사진 여러 장, 조회수
- [ ] 6단계: 배포 (가계부와는 다른 링크로)
