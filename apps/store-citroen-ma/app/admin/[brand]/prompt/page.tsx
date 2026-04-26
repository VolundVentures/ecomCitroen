import { adminClient } from "@/lib/supabase/admin";
import type { Brand, PromptVersion } from "@/lib/supabase/database.types";
import { savePromptAction, activatePromptAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PromptEditor({ params }: { params: Promise<{ brand: string }> }) {
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
  const active = prompts.find((p) => p.is_active) ?? prompts[0];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-lg font-medium">Prompt</h2>
        <div className="text-[11px] text-white/40">
          Active: v{active?.version ?? "—"}
          {active?.created_at && ` · ${new Date(active.created_at).toLocaleString()}`}
        </div>
      </div>

      <form action={savePromptAction} className="space-y-3">
        <input type="hidden" name="brandSlug" value={slug} />
        <textarea
          name="body"
          defaultValue={active?.body ?? ""}
          rows={24}
          className="block w-full rounded-xl border border-white/10 bg-[#0a0a0e] px-4 py-3 font-mono text-[12px] leading-relaxed text-white outline-none focus:border-white/30"
          spellCheck={false}
        />
        <input
          name="notes"
          placeholder="What changed in this version?"
          className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-white/30"
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[12px] text-white/60">
            <input name="activate" type="checkbox" defaultChecked className="accent-white" />
            Activate immediately
          </label>
          <button type="submit" className="ms-auto rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-[#0c0c10] hover:bg-white/90">
            Save new version
          </button>
        </div>
      </form>

      <h3 className="mt-12 mb-3 text-[11px] uppercase tracking-[0.18em] text-white/40">Version history</h3>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-[12px]">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-4 py-2 text-start font-normal">v</th>
              <th className="px-4 py-2 text-start font-normal">Created</th>
              <th className="px-4 py-2 text-start font-normal">Notes</th>
              <th className="px-4 py-2 text-start font-normal">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((p) => (
              <tr key={p.id} className="border-t border-white/5 text-white/70">
                <td className="px-4 py-2 font-mono">{p.version}</td>
                <td className="px-4 py-2">{new Date(p.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 truncate">{p.notes ?? "—"}</td>
                <td className="px-4 py-2">
                  {p.is_active ? <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300">active</span> : null}
                </td>
                <td className="px-4 py-2 text-end">
                  {!p.is_active && (
                    <form action={activatePromptAction} className="inline">
                      <input type="hidden" name="brandSlug" value={slug} />
                      <input type="hidden" name="promptId" value={p.id} />
                      <button type="submit" className="text-white/40 hover:text-white">Activate</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
