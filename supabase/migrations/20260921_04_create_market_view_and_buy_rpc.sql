-- 매물 목록용 뷰: 판매자 닉네임 + 카테고리 + 같은 물건 중 최저가 여부
-- security_invoker = true 라서 뷰를 통해도 RLS 가 그대로 적용된다.
create or replace view public.market_products_view
with (security_invoker = true) as
select
  v.*,
  (v.status = 'selling' and v.same_model_count > 1 and v.price = v.lowest_price) as is_lowest
from (
  select
    p.id,
    p.seller_id,
    p.category_slug,
    p.title,
    p.description,
    p.price,
    p.region,
    p.image_path,
    p.status,
    p.buyer_id,
    p.sold_at,
    p.model_key,
    p.created_at,
    c.label as category_label,
    c.emoji as category_emoji,
    pr.nickname as seller_nickname,
    pr.avatar_emoji as seller_emoji,
    min(p.price) filter (where p.status = 'selling')
      over (partition by p.model_key) as lowest_price,
    count(*) filter (where p.status = 'selling')
      over (partition by p.model_key) as same_model_count
  from public.market_products p
  join public.market_profiles pr on pr.id = p.seller_id
  join public.market_categories c on c.slug = p.category_slug
) v;

-- 구매 처리.
-- RLS 로는 "남의 매물을 sold 로만 바꾸기"를 표현하기 어려워서,
-- 조건을 함수 안에 넣고 이 함수로만 상태를 바꾸게 했다.
create or replace function public.market_buy_product(p_product_id uuid)
returns public.market_products
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer uuid := auth.uid();
  v_row public.market_products;
begin
  if v_buyer is null then
    raise exception '로그인이 필요해요.' using errcode = '28000';
  end if;

  update public.market_products
     set status = 'sold',
         buyer_id = v_buyer,
         sold_at = now()
   where id = p_product_id
     and status = 'selling'
     and seller_id <> v_buyer
  returning * into v_row;

  if v_row.id is null then
    raise exception '이미 거래가 끝났거나 살 수 없는 매물이에요.' using errcode = 'P0001';
  end if;

  -- 산 물건은 내 장바구니에서 빼 준다.
  delete from public.market_cart_items
   where user_id = v_buyer and product_id = p_product_id;

  return v_row;
end;
$$;

-- 로그인한 사람만 호출할 수 있다.
revoke execute on function public.market_buy_product(uuid) from public, anon;
grant execute on function public.market_buy_product(uuid) to authenticated;
