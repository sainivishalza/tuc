import { isAdminRequest } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  if (!(await isAdminRequest())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) return new Response("Failed to export", { status: 500 });

  const csv = toCsv(data ?? [], [
    { key: "created_at", label: "Date" },
    { key: "entity_type", label: "Type" },
    { key: "product_title", label: "Product" },
    { key: "supplier_company_name", label: "Supplier" },
    { key: "channel", label: "Channel" },
    { key: "locale", label: "Locale" },
    { key: "path", label: "Page" },
  ]);

  return csvResponse(`inquiries-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
