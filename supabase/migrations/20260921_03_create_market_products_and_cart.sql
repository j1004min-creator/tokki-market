-- 토끼마켓 2단계: 카테고리 / 매물 / 장바구니

-- 1) 카테고리 --------------------------------------------------------------
create table if not exists public.market_categories (
  slug text primary key,
  label text not null,
  emoji text not null,
  sort_order smallint not null default 0
);

alter table public.market_categories enable row level security;

create policy "market_categories_select_public"
  on public.market_categories for select to anon, authenticated using (true);

insert into public.market_categories (slug, label, emoji, sort_order) values
  ('digital',   '디지털',       '📱', 1),
  ('furniture', '가구·인테리어', '🪑', 2),
  ('clothes',   '의류',         '👕', 3),
  ('book',      '도서',         '📚', 4),
  ('kids',      '유아',         '🧸', 5),
  ('sports',    '스포츠',       '⚽', 6),
  ('appliance', '생활가전',     '🔌', 7),
  ('beauty',    '뷰티',         '💄', 8),
  ('pet',       '반려동물',     '🐶', 9),
  ('etc',       '기타',         '📦', 10)
on conflict (slug) do nothing;

-- 2) 매물 ------------------------------------------------------------------
create table if not exists public.market_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  category_slug text not null references public.market_categories(slug),
  title text not null check (char_length(trim(title)) between 2 and 60),
  description text check (char_length(description) <= 2000),
  price integer not null check (price >= 0 and price <= 100000000),
  region text check (char_length(region) <= 30),
  image_path text,
  status text not null default 'selling' check (status in ('selling', 'reserved', 'sold')),
  buyer_id uuid references auth.users(id) on delete set null,
  sold_at timestamptz,
  -- 같은 물건끼리 묶기 위한 키. 제목에서 공백·기호를 지우고 소문자로.
  model_key text generated always as (
    lower(regexp_replace(title, '[^0-9a-zA-Z가-힣]', '', 'g'))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists market_products_category_idx on public.market_products (category_slug, created_at desc);
create index if not exists market_products_model_key_idx on public.market_products (model_key) where status = 'selling';
create index if not exists market_products_seller_idx on public.market_products (seller_id, created_at desc);
create index if not exists market_products_buyer_idx on public.market_products (buyer_id, sold_at desc);

alter table public.market_products enable row level security;

-- 매물은 누구나 볼 수 있고, 손대는 건 올린 사람만.
create policy "market_products_select_public"
  on public.market_products for select to anon, authenticated using (true);

create policy "market_products_insert_own"
  on public.market_products for insert to authenticated
  with check ((select auth.uid()) = seller_id and status = 'selling' and buyer_id is null);

create policy "market_products_update_own"
  on public.market_products for update to authenticated
  using ((select auth.uid()) = seller_id)
  with check ((select auth.uid()) = seller_id);

create policy "market_products_delete_own"
  on public.market_products for delete to authenticated
  using ((select auth.uid()) = seller_id);

create trigger market_products_touch_updated_at
  before update on public.market_products
  for each row execute function public.market_touch_updated_at();

-- 3) 장바구니 ---------------------------------------------------------------
create table if not exists public.market_cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.market_products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.market_cart_items enable row level security;

create policy "market_cart_select_own"
  on public.market_cart_items for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "market_cart_insert_own"
  on public.market_cart_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "market_cart_delete_own"
  on public.market_cart_items for delete to authenticated
  using ((select auth.uid()) = user_id);
