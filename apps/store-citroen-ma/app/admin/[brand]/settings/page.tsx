// /admin/[brand]/settings — brand-level config (color, voice, locales, models on/off).

import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Model } from "@/lib/supabase/database.types";
import { BrandSettingsForm } from "@/components/admin/BrandSettingsForm";
import { ModelToggleList } from "@/components/admin/ModelToggleList";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params;
  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand;
  const { data: modelRows } = await supa.from("models").select("*").eq("brand_id", brand.id).order("display_order");
  const models = (modelRows as unknown as Model[]) ?? [];

  return (
    <div className="px-8 py-8">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight">Brand settings</h1>
        <div className="mt-1 text-[12px] text-white/45">Theme, voice, locales, and the model lineup that Rihla can recommend.</div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[420px_1fr]">
        <div>
          <BrandSettingsForm brand={brand} />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div>
            <div className="text-[13px] font-semibold">Model lineup</div>
            <div className="mt-0.5 text-[11px] text-white/40">
              Toggle which models Rihla can recommend. Disabled models stay in the database but
              don't appear in the catalog.
            </div>
          </div>
          <ModelToggleList models={models} accent={brand.primary_color ?? "#6366f1"} />
        </div>
      </div>
    </div>
  );
}
