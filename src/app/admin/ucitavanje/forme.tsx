"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  ucitajGradskuListu,
  ucitajViseListova,
  ucitajBarKodove,
  type StanjeUcitavanja,
} from "./akcije";

function Dugme({ tekst }: { tekst: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "Учитавам…" : tekst}
    </button>
  );
}

function Poruka({ stanje }: { stanje: StanjeUcitavanja }) {
  if (!stanje) return null;
  return (
    <p
      role="alert"
      className={
        stanje.ok
          ? "rounded-md bg-green-50 px-3 py-2 text-sm text-green-800"
          : "rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
      }
    >
      {stanje.ok ? stanje.poruka : stanje.greska}
    </p>
  );
}

export function FormaGradskaLista() {
  const [stanje, akcija] = useActionState<StanjeUcitavanja, FormData>(
    ucitajGradskuListu,
    undefined,
  );
  return (
    <form action={akcija} className="space-y-4">
      <div>
        <label htmlFor="naziv" className="block text-sm font-medium">
          Назив града (ћирилицом, како ће се видјети у менију)
        </label>
        <input
          id="naziv"
          name="naziv"
          type="text"
          placeholder="нпр. Бања Лука"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
        />
      </div>
      <div>
        <label htmlFor="datoteka-grad" className="block text-sm font-medium">
          Excel фајл (.xlsx или .xls)
        </label>
        <input
          id="datoteka-grad"
          name="datoteka"
          type="file"
          accept=".xlsx,.xls"
          className="mt-1 block w-full text-sm"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Из сваког реда се узима прва ћелија која личи на „Име Презиме"; бар код
          је ћелија са 13 цифара (ако постоји). Телефони и датуми се игноришу.
        </p>
      </div>
      <Dugme tekst="Учитај листу града" />
      <Poruka stanje={stanje} />
    </form>
  );
}

export function FormaViseListova() {
  const [stanje, akcija] = useActionState<StanjeUcitavanja, FormData>(
    ucitajViseListova,
    undefined,
  );
  return (
    <form action={akcija} className="space-y-4">
      <div>
        <label htmlFor="datoteka-vise" className="block text-sm font-medium">
          Excel фајл са више листова (.xlsx или .xls)
        </label>
        <input
          id="datoteka-vise"
          name="datoteka"
          type="file"
          accept=".xlsx,.xls"
          className="mt-1 block w-full text-sm"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Сваки лист = један град. Као назив града се узима назив листа — послије
          учитавања провјери називе на страници „Градови" и по потреби их
          преименуј.
        </p>
      </div>
      <Dugme tekst="Учитај све листове" />
      <Poruka stanje={stanje} />
    </form>
  );
}

export function FormaBarKodovi() {
  const [stanje, akcija] = useActionState<StanjeUcitavanja, FormData>(
    ucitajBarKodove,
    undefined,
  );
  return (
    <form action={akcija} className="space-y-4">
      <div>
        <label htmlFor="datoteka-kodovi" className="block text-sm font-medium">
          Excel фајл са комплетном листом бар кодова (.xlsx или .xls)
        </label>
        <input
          id="datoteka-kodovi"
          name="datoteka"
          type="file"
          accept=".xlsx,.xls"
          className="mt-1 block w-full text-sm"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Свака ћелија која је 13 цифара се узима као бар код (~12.000).
        </p>
      </div>
      <Dugme tekst="Учитај бар кодове" />
      <Poruka stanje={stanje} />
    </form>
  );
}
