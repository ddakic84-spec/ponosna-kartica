import { daLiJePrijavljen } from "@/lib/admin-sesija";
import { napraviIzvozZahtjeva } from "@/lib/izvoz";

// GET /admin/preuzmi — преузимање свих захтјева као Excel (само за пријављеног админа).
export async function GET() {
  if (!(await daLiJePrijavljen())) {
    return new Response("Није дозвољено.", { status: 401 });
  }

  const podaci = await napraviIzvozZahtjeva();
  const datum = new Date().toISOString().slice(0, 10);

  return new Response(podaci, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="zahtjevi_${datum}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
