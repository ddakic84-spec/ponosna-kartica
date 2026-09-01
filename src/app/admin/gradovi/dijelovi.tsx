"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  dodajGrad,
  obrisiGrad,
  preimenujGrad,
  type StanjeGrada,
} from "./akcije";

function DugmeDodaj() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "…" : "Додај"}
    </button>
  );
}

export function FormaDodajGrad() {
  const [stanje, akcija] = useActionState<StanjeGrada, FormData>(
    dodajGrad,
    undefined,
  );
  return (
    <form action={akcija} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="naziv"
          type="text"
          placeholder="нпр. Требиње"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
        />
        <DugmeDodaj />
      </div>
      {stanje && (
        <p
          role="alert"
          className={`text-sm ${stanje.ok ? "text-green-700" : "text-red-700"}`}
        >
          {stanje.poruka}
        </p>
      )}
    </form>
  );
}

export function DugmePreimenuj({ naziv }: { naziv: string }) {
  return (
    <button
      type="button"
      className="text-sm text-zinc-600 underline hover:text-zinc-900"
      onClick={async () => {
        const novo = window.prompt(`Нови назив за „${naziv}":`, naziv);
        if (!novo || !novo.trim() || novo.trim() === naziv) return;
        const fd = new FormData();
        fd.set("staro", naziv);
        fd.set("novo", novo.trim());
        await preimenujGrad(fd);
      }}
    >
      преименуј
    </button>
  );
}

export function DugmeObrisiGrad({
  naziv,
  brojKorisnika,
}: {
  naziv: string;
  brojKorisnika: number;
}) {
  return (
    <form
      action={obrisiGrad}
      onSubmit={(e) => {
        if (
          !confirm(
            `Обрисати град „${naziv}" и свих ${brojKorisnika} припадајућих корисника? Ово се не може поништити.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="naziv" value={naziv} />
      <button
        type="submit"
        className="text-sm text-red-700 underline hover:text-red-900"
      >
        обриши
      </button>
    </form>
  );
}
