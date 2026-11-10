-- BusinessOS: bucket privado "arquivos" e políticas por dono.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'arquivos', 'arquivos', false, 26214400, -- 25 MB
  array[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- O dono só acessa objetos cujo primeiro segmento do caminho é o seu auth.uid().
drop policy if exists arquivos_objetos_select on storage.objects;
drop policy if exists arquivos_objetos_insert on storage.objects;
drop policy if exists arquivos_objetos_update on storage.objects;
drop policy if exists arquivos_objetos_delete on storage.objects;

create policy arquivos_objetos_select on storage.objects for select to authenticated
  using (bucket_id = 'arquivos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy arquivos_objetos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'arquivos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy arquivos_objetos_update on storage.objects for update to authenticated
  using (bucket_id = 'arquivos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'arquivos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy arquivos_objetos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'arquivos' and (storage.foldername(name))[1] = (select auth.uid())::text);
