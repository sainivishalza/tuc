import { isAdminRequest } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  if (!(await isAdminRequest())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sourcing_requests")
    .select("*, sourcing_categories(name)")
    .order("created_at", { ascending: false });

  if (error) return new Response("Failed to export", { status: 500 });

  const rows = (data ?? []).map((r) => ({
    ...r,
    category_name: (r as { sourcing_categories?: { name?: string } | null }).sourcing_categories?.name ?? "",
  }));

  const csv = toCsv(rows, [
    { key: "created_at", label: "Date" },
    { key: "title", label: "Title" },
    { key: "type", label: "Type" },
    { key: "category_name", label: "Category" },
    { key: "quantity", label: "Quantity" },
    { key: "budget_range", label: "Budget" },
    { key: "timeline", label: "Timeline" },
    { key: "destination_country", label: "Destination" },
    { key: "customer_name", label: "Customer" },
    { key: "customer_email", label: "Email" },
    { key: "customer_whatsapp", label: "WhatsApp" },
    { key: "status", label: "Status" },
    { key: "source", label: "Source" },
  ]);

  return csvResponse(`sourcing-requests-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
