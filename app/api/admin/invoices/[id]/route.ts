import { isAdminRequest } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { buildInvoicePdf } from "@/lib/pdfDocuments";
import type { QuoteRequest } from "@/lib/supabase/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("quote_requests").select("*").eq("id", id).maybeSingle();
  if (error || !data) return new Response("Quote request not found", { status: 404 });

  const quote = data as QuoteRequest;
  if (quote.quoted_value === null) {
    return new Response("Set a quoted value before generating an invoice.", { status: 400 });
  }

  const pdf = await buildInvoicePdf(quote);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${id.slice(0, 8)}.pdf"`,
    },
  });
}
