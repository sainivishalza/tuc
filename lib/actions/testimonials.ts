"use server";

import { revalidatePath } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { Testimonial } from "@/lib/supabase/types";

export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as Testimonial[];
}

export async function getAllTestimonials(): Promise<Testimonial[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Testimonial[];
}

export interface TestimonialInput {
  name: string;
  company: string;
  quote: string;
  rating: number;
  locale: string;
  status: Testimonial["status"];
}

export async function createTestimonial(input: TestimonialInput): Promise<void> {
  await requireAdminAction();
  if (!input.name.trim() || !input.quote.trim()) {
    throw new Error("Name and quote are required.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("testimonials").insert({
    name: input.name.trim(),
    company: input.company.trim() || null,
    quote: input.quote.trim(),
    rating: input.rating,
    locale: input.locale,
    status: input.status,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/testimonials");
  revalidatePath("/[locale]", "page");
}

export async function updateTestimonialStatus(
  id: string,
  status: Testimonial["status"]
): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("testimonials")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/testimonials");
  revalidatePath("/[locale]", "page");
}

export async function deleteTestimonial(id: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/testimonials");
  revalidatePath("/[locale]", "page");
}
