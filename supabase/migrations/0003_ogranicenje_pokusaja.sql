-- =====================================================================
--  Поносна картица — измјена 3:
--  таблица за ограничење броја покушаја (провјера захтјева и админ пријава).
--  Чува се само хеш IP адресе (не сама адреса) и вријеме; редови старији
--  од 24h се аутоматски бришу.
-- =====================================================================

create table if not exists provjere_log (
  id       bigint generated always as identity primary key,
  kljuc    text not null,   -- врста радње + хеш IP адресе
  vrijeme  timestamptz not null default now()
);

create index if not exists provjere_log_kljuc_vrijeme_idx
  on provjere_log (kljuc, vrijeme);

alter table provjere_log enable row level security;
