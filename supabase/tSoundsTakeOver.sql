-- Ejecutar este script una sola vez en el SQL Editor de Supabase.
-- La copia principal tambien se encuentra en take-over-admin/supabase/tSoundsTakeOver.sql.

create table if not exists public."tSoundsTakeOver" (
  id bigint generated always as identity primary key,
  titulo text not null,
  artista text,
  soundcloud_url text not null,
  artwork_url text,
  orden integer not null default 0 check (orden >= 0),
  activo boolean not null default true,
  creado_en timestamp with time zone not null default now(),
  actualizado_en timestamp with time zone not null default now(),
  constraint sounds_take_over_soundcloud_url_check
    check (soundcloud_url ~* '^https://(www\.)?(soundcloud\.com|on\.soundcloud\.com)/')
);

create index if not exists sounds_take_over_publicacion_idx
  on public."tSoundsTakeOver" (activo, orden, creado_en);

create or replace function public.set_sounds_take_over_updated_at()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists set_sounds_take_over_updated_at on public."tSoundsTakeOver";
create trigger set_sounds_take_over_updated_at
before update on public."tSoundsTakeOver"
for each row execute function public.set_sounds_take_over_updated_at();

alter table public."tSoundsTakeOver" enable row level security;

drop policy if exists "Public can read active sounds" on public."tSoundsTakeOver";
create policy "Public can read active sounds"
  on public."tSoundsTakeOver" for select to anon using (activo = true);

drop policy if exists "Authenticated users can read sounds" on public."tSoundsTakeOver";
create policy "Authenticated users can read sounds"
  on public."tSoundsTakeOver" for select to authenticated using (true);

drop policy if exists "Authenticated users can insert sounds" on public."tSoundsTakeOver";
create policy "Authenticated users can insert sounds"
  on public."tSoundsTakeOver" for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update sounds" on public."tSoundsTakeOver";
create policy "Authenticated users can update sounds"
  on public."tSoundsTakeOver" for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete sounds" on public."tSoundsTakeOver";
create policy "Authenticated users can delete sounds"
  on public."tSoundsTakeOver" for delete to authenticated using (true);

grant select on public."tSoundsTakeOver" to anon;
grant select, insert, update, delete on public."tSoundsTakeOver" to authenticated;
grant usage, select on sequence public."tSoundsTakeOver_id_seq" to authenticated;
