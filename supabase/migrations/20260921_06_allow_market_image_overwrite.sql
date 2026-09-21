-- 본인 폴더의 사진은 같은 경로에 덮어쓸 수 있어야 한다.
-- (INSERT 정책만 있으면 upsert 가 UPDATE 로 걸려 "new row violates row-level
--  security policy" 로 거부된다)
create policy "market_images_update_own_folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'market-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'market-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
