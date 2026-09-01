import "server-only";
import { supabaseServer } from "@/lib/supabase-server";

// Заједнички упити у базу које користе и админ дио и (касније) јавна провјера.

export async function dajGradove(): Promise<string[]> {
  const { data, error } = await supabaseServer
    .from("gradovi")
    .select("naziv")
    .order("naziv");
  if (error) throw error;
  return (data ?? []).map((g) => g.naziv as string);
}

export async function brojRedova(tabela: string): Promise<number> {
  const { count, error } = await supabaseServer
    .from(tabela)
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}
