"use server";

import { revalidatePath } from "next/cache";
import { zahtijevajAdmina } from "@/lib/admin-sesija";
import { supabaseServer } from "@/lib/supabase-server";

export type StanjeGrada = { ok: boolean; poruka: string } | undefined;

export async function dodajGrad(
  _prethodno: StanjeGrada,
  formData: FormData,
): Promise<StanjeGrada> {
  await zahtijevajAdmina();
  const naziv = String(formData.get("naziv") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!naziv) return { ok: false, poruka: "Унеси назив града." };

  const { error } = await supabaseServer
    .from("gradovi")
    .upsert({ naziv }, { onConflict: "naziv", ignoreDuplicates: true });
  if (error) return { ok: false, poruka: `Грешка: ${error.message}` };

  revalidatePath("/admin/gradovi");
  revalidatePath("/admin/ucitavanje");
  return { ok: true, poruka: `Град „${naziv}" је у листи.` };
}

export async function preimenujGrad(formData: FormData): Promise<void> {
  await zahtijevajAdmina();
  const staro = String(formData.get("staro") ?? "");
  const novo = String(formData.get("novo") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!staro || !novo || staro === novo) return;

  // Назив града стоји као текст у три табеле — мијењамо у све три.
  await supabaseServer.from("gradovi").update({ naziv: novo }).eq("naziv", staro);
  await supabaseServer
    .from("korisnici_kartice")
    .update({ grad: novo })
    .eq("grad", staro);
  await supabaseServer.from("zahtjevi").update({ grad: novo }).eq("grad", staro);

  revalidatePath("/admin/gradovi");
  revalidatePath("/admin/ucitavanje");
  revalidatePath("/admin");
}

export async function obrisiGrad(formData: FormData): Promise<void> {
  await zahtijevajAdmina();
  const naziv = String(formData.get("naziv") ?? "");
  if (!naziv) return;

  // Прво кориснике тог града, па сам град.
  await supabaseServer.from("korisnici_kartice").delete().eq("grad", naziv);
  await supabaseServer.from("gradovi").delete().eq("naziv", naziv);

  revalidatePath("/admin/gradovi");
  revalidatePath("/admin/ucitavanje");
  revalidatePath("/admin");
}
