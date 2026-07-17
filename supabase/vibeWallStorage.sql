-- Ejecutar después de crear public."tGaleria".

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'galeria-eventos', 'galeria-eventos', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public."tGaleria" enable row level security;

drop policy if exists "Galeria activa es publica" on public."tGaleria";
create policy "Galeria activa es publica"
on public."tGaleria" for select to anon using (activo = true);

drop policy if exists "Usuarios autenticados administran galeria" on public."tGaleria";
create policy "Usuarios autenticados administran galeria"
on public."tGaleria" for all to authenticated
using (true) with check (true);

drop policy if exists "Galeria storage lectura publica" on storage.objects;
create policy "Galeria storage lectura publica"
on storage.objects for select to public
using (bucket_id = 'galeria-eventos');

drop policy if exists "Galeria storage insercion autenticada" on storage.objects;
create policy "Galeria storage insercion autenticada"
on storage.objects for insert to authenticated
with check (bucket_id = 'galeria-eventos');

drop policy if exists "Galeria storage actualizacion autenticada" on storage.objects;
create policy "Galeria storage actualizacion autenticada"
on storage.objects for update to authenticated
using (bucket_id = 'galeria-eventos')
with check (bucket_id = 'galeria-eventos');

drop policy if exists "Galeria storage eliminacion autenticada" on storage.objects;
create policy "Galeria storage eliminacion autenticada"
on storage.objects for delete to authenticated
using (bucket_id = 'galeria-eventos');

grant select on public."tGaleria" to anon;
grant all on public."tGaleria" to authenticated;
grant usage, select on sequence public."tGaleria_id_seq" to authenticated;
