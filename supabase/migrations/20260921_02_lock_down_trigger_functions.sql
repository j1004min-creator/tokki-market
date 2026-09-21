-- 트리거 전용 함수가 REST API(rpc)로 직접 호출되지 않도록 막는다.
revoke execute on function public.handle_new_market_user() from public, anon, authenticated;
revoke execute on function public.market_touch_updated_at() from public, anon, authenticated;
