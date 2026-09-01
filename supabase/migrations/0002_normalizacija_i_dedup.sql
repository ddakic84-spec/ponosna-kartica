-- =====================================================================
--  Поносна картица — измјена 2:
--  (1) нормализовано име за брзо и „паметно" поређење при провјери
--  (2) спречавање дуплих уноса при поновном учитавању листе
--  Залијепи и покрени у Supabase SQL Editor-у (послије измјене 1).
-- =====================================================================

-- (1) Помоћна колона: име сведено на облик за поређење
--     (без вишка размака, латинична слова претворена у ћирилична, мала слова).
--     Пуни је апликација при учитавању — овдје је само правимо.
alter table korisnici_kartice
  add column if not exists ime_norm text;

create index if not exists korisnici_kartice_grad_ime_norm_idx
  on korisnici_kartice (grad, ime_norm);

-- (2) Иста особа (исти град + исто име + исти бар код) уписује се само једном.
--     Тако поновно учитавање листе само дописује НОВЕ редове.
do $$ begin
  alter table korisnici_kartice
    add constraint korisnici_kartice_jedinstven
    unique nulls not distinct (grad, ime_prezime, bar_kod);
exception
  when duplicate_object then null;  -- правило већ постоји
  when duplicate_table then null;   -- индекс истог имена већ постоји
end $$;
