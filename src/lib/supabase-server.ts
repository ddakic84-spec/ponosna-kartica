import "server-only";
import { createClient } from "@supabase/supabase-js";

// Веза са базом за СЕРВЕРСКИ код (API руте, серверске компоненте).
//
// Овдје се користи "service_role" кључ, који заобилази сигурносна правила базе.
// Зато овај фајл СМИЈЕ да се увезе само у серверски код. Ред `import "server-only"`
// изнад ће зауставити пробни превод (build) ако неко случајно овај фајл увезе
// у компоненту означену са "use client".

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Недостаје NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY у .env.local",
  );
}

export const supabaseServer = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
