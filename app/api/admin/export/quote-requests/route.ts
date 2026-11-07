import { isAdminRequest } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  if (!(await isAdminRequest())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return new Response("Failed to export", { status: 500 });

  const csv = toCsv(data ?? [], [
    { key: "created_at", label: "Date" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "product", label: "Product" },
    { key: "quantity", label: "Quantity" },
    { key: "timeline", label: "Timeline" },
    { key: "message", label: "Message" },
    { key: "status", label: "Status" },
    { key: "quoted_value", label: "Quoted Value" },
  ]);

  return csvResponse(`quote-requests-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
