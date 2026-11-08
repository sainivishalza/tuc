import { isAdminRequest } from "@/lib/adminAuth";
import { buildContractTemplatePdf } from "@/lib/pdfDocuments";

export async function GET() {
  if (!(await isAdminRequest())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const pdf = await buildContractTemplatePdf();
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sourcing-service-agreement-template.pdf"`,
    },
  });
}
