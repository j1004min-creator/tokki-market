-- 매물 사진 보관함. 읽기는 공개, 쓰기는 본인 폴더(user_id/...)에만.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'market-images',
  'market-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "market_images_read_public"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'market-images');

create policy "market_images_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'market-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "market_images_delete_own_folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'market-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
