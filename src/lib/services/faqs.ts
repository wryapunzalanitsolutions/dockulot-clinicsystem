import { unstable_noStore as noStore } from "next/cache";
import { faqs as fallbackFaqs } from "@/src/lib/healthcare-content";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export type PublicFaq = {
  id?: string;
  category: string;
  question: string;
  answer: string;
  sort_order?: number;
  is_published?: boolean;
};

export async function getPublishedFaqs(): Promise<PublicFaq[]> {
  noStore();

  const { data, error } = await getSupabaseAdmin()
    .from("faqs")
    .select("*")
    .eq("is_published", true)
    .order("sort_order")
    .order("category");

  if (error) throw error;

  const faqs = (data ?? []) as PublicFaq[];
  return faqs.length ? faqs : fallbackFaqs;
}
