create table "tTeaserConfig" (
  id bigint primary key generated always as identity,
  fecha_teaser timestamp with time zone not null,
  titulo_teaser text not null,
  activo boolean default true
);
