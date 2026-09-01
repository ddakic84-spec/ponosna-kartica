-- =====================================================================
--  Поносна картица 2026–2028 — почетне табеле
--  Овај фајл се једном залијепи и покрене у Supabase SQL Editor-у.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ГРАДОВИ — списак за падајући мени на форми.
--    Попуњава се из назива Excel листова, а админ може ручно да дода.
-- ---------------------------------------------------------------------
create table if not exists gradovi (
  id       bigint generated always as identity primary key,
  naziv    text not null unique,
  kreiran  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2) КОРИСНИЦИ КАРТИЦЕ — твоје листе по градовима.
--    bar_kod може бити празан (неке листе немају бар код).
-- ---------------------------------------------------------------------
create table if not exists korisnici_kartice (
  id              bigint generated always as identity primary key,
  ime_prezime     text not null,
  grad            text not null,
  bar_kod         text,
  izvor_datoteka  text,
  kreiran         timestamptz not null default now()
);

create index if not exists korisnici_kartice_grad_idx     on korisnici_kartice (grad);
create index if not exists korisnici_kartice_bar_kod_idx  on korisnici_kartice (bar_kod);

-- ---------------------------------------------------------------------
-- 3) БАР КОДОВИ — комплетна листа (~12.000) за корак 3 провјере.
--    Сваки бар код се памти само једном.
-- ---------------------------------------------------------------------
create table if not exists bar_kodovi (
  bar_kod  text primary key,
  kreiran  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4) ЗАХТЈЕВИ — поднесени (и прихваћени) захтјеви грађана.
--    Уписује се само кад је захтјев прихваћен.
--    Колона bar_kod чува ТАЧНО оно што је грађанин укуцао (то се види
--    у Excel извјештају).
--    Иста комбинација име + град + бар код може се поднијети само једном
--    (правило `zahtjevi_jedinstven` испод).
-- ---------------------------------------------------------------------
create table if not exists zahtjevi (
  id                bigint generated always as identity primary key,
  ime_prezime       text not null,
  grad              text not null,
  bar_kod           text not null,
  telefon           text not null,
  nacin_prihvatanja text,
  vrijeme           timestamptz not null default now(),
  constraint zahtjevi_jedinstven unique (ime_prezime, grad, bar_kod)
);

create index if not exists zahtjevi_grad_idx on zahtjevi (grad);

-- =====================================================================
--  СИГУРНОСТ: укључујемо "Row Level Security" на свим табелама и НЕ
--  додајемо ниједно правило за јавни приступ. То значи: нико са
--  интернета (anon кључ) не може ништа да чита ни пише директно.
--  Сав приступ иде преко нашег серверског кода (service_role кључ,
--  који RLS заобилази).
-- =====================================================================
alter table gradovi            enable row level security;
alter table korisnici_kartice  enable row level security;
alter table bar_kodovi         enable row level security;
alter table zahtjevi           enable row level security;
