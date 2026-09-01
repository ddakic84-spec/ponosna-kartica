-- =====================================================================
--  Поносна картица — измјена 4:
--  један захтјев по особи (град + нормализовано име).
--  Залијепи и покрени у Supabase SQL Editor-у (послије измјене 3).
-- =====================================================================

-- Нормализовано име и у табели захтјева (за брзу провјеру „да ли је особа
-- већ поднијела захтјев").
alter table zahtjevi
  add column if not exists ime_norm text;

create index if not exists zahtjevi_grad_ime_norm_idx
  on zahtjevi (grad, ime_norm);

-- Старо правило (име + град + бар код) замјењујемо строжијим: један захтјев
-- по особи (град + име), без обзира на бар код.
alter table zahtjevi
  drop constraint if exists zahtjevi_jedinstven;

do $$ begin
  alter table zahtjevi
    add constraint zahtjevi_jedan_po_osobi
    unique nulls not distinct (grad, ime_norm);
exception
  when duplicate_object then null;
  when duplicate_table then null;
end $$;
