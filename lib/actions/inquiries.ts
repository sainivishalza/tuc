"use server";

import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { Inquiry } from "@/lib/supabase/types";

const MAX_INQUIRIES = 2000;

export interface TopProduct {
  entity_id: string;
  title: string;
  supplier_company_name: string;
  count: number;
}

export interface TopSupplier {
  supplier_id: string;
  company_name: string;
  count: number;
}

export interface InquiriesSummary {
  total: number;
  last7Days: number;
  topProducts: TopProduct[];
  topSuppliers: TopSupplier[];
  recent: Inquiry[];
}

export async function getInquiriesSummary(): Promise<InquiriesSummary> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_INQUIRIES);

  if (error || !data) {
    return { total: 0, last7Days: 0, topProducts: [], topSuppliers: [], recent: [] };
  }

  const rows = data as Inquiry[];
  const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const productCounts = new Map<string, Omit<TopProduct, "entity_id">>();
  const supplierCounts = new Map<string, Omit<TopSupplier, "supplier_id">>();
  let last7Days = 0;

  for (const r of rows) {
    if (new Date(r.created_at).getTime() >= sevenDaysAgoMs) last7Days++;

    if (r.entity_type === "product") {
      const existing = productCounts.get(r.entity_id);
      productCounts.set(r.entity_id, {
        title: r.product_title ?? existing?.title ?? "Untitled product",
        supplier_company_name: r.supplier_company_name,
        count: (existing?.count ?? 0) + 1,
      });
    }

    const existingSupplier = supplierCounts.get(r.supplier_id);
    supplierCounts.set(r.supplier_id, {
      company_name: r.supplier_company_name,
      count: (existingSupplier?.count ?? 0) + 1,
    });
  }

  const topProducts = Array.from(productCounts.entries())
    .map(([entity_id, v]) => ({ entity_id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topSuppliers = Array.from(supplierCounts.entries())
    .map(([supplier_id, v]) => ({ supplier_id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total: rows.length,
    last7Days,
    topProducts,
    topSuppliers,
    recent: rows.slice(0, 20),
  };
}
