import type { NextRequest } from "next/server";
import { daLiJePrijavljen } from "@/lib/admin-sesija";
import { napraviIzvozZahtjeva, oznaciKaoPreuzete } from "@/lib/izvoz";

const XLSX_TIP =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function odgovor(podaci: ArrayBuffer, nazivFajla: string): Response {
  return new Response(podaci, {
    headers: {
      "Content-Type": XLSX_TIP,
      "Content-Disposition": `attachment; filename="${nazivFajla}"`,
      "Cache-Control": "no-store",
    },
  });
}

const danas = () => new Date().toISOString().slice(0, 10);

// GET /admin/preuzmi             — сви захтјеви
// GET /admin/preuzmi?vrsta=zadnji — поново задња група преузетих „нових"
// (Ништа се не мијења у бази.)
export async function GET(request: NextRequest) {
  if (!(await daLiJePrijavljen())) {
    return new Response("Није дозвољено.", { status: 401 });
  }

  if (request.nextUrl.searchParams.get("vrsta") === "zadnji") {
    const { podaci } = await napraviIzvozZahtjeva("zadnji");
    return odgovor(podaci, `zahtjevi_zadnje_preuzeti_${danas()}.xlsx`);
  }

  const { podaci } = await napraviIzvozZahtjeva("svi");
  return odgovor(podaci, `zahtjevi_${danas()}.xlsx`);
}

// POST /admin/preuzmi — само НОВИ захтјеви (од задњег преузимања). Послије
// успјешног прављења фајла, ти захтјеви се биљеже као преузети. Намјерно је
// POST (не GET), да случајно поновно отварање линка не „потроши" нове захтјеве.
export async function POST() {
  if (!(await daLiJePrijavljen())) {
    return new Response("Није дозвољено.", { status: 401 });
  }

  const { podaci, ids } = await napraviIzvozZahtjeva("novi");
  if (ids.length > 0) {
    // Ако биљежење не успије, баца се грешка и фајл се НЕ враћа — захтјеви
    // остају „нови", па се ништа не губи.
    await oznaciKaoPreuzete(ids, new Date().toISOString());
  }
  return odgovor(podaci, `zahtjevi_novi_${danas()}.xlsx`);
}
