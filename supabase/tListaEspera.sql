create table "tListaEspera" (
  id bigint primary key generated always as identity,
  correo text unique not null,
  creado_en timestamp with time zone default now()
);
