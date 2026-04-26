// /admin/[brand]/prompt — prompt editor with version history.

import { adminClient } from "@/lib/supabase/admin";
import type { Brand, PromptVersion } from "@/lib/supabase/database.types";
import { PromptEditorClient } from "@/components/admin/PromptEditorClient";

export const dynamic = "force-dynamic";

export default async function PromptEditorPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params;
  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand;

  const { data: promptsRows } = await supa
    .from("prompts")
    .select("*")
    .eq("brand_id", brand.id)
    .order("version", { ascending: false })
    .limit(20);
  const prompts = (promptsRows as unknown as PromptVersion[]) ?? [];

  const accent = brand.primary_color ?? "#6366f1";

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Prompt</h1>
        <div className="mt-1 text-[12px] text-white/45">
          Edit Rihla's system prompt for {brand.name}. Save creates a new version. Older versions stay reachable for one-click rollback.
        </div>
      </div>

      <PromptEditorClient slug={slug} prompts={prompts} accent={accent} />
    </div>
  );
}
