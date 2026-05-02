// /admin/[brand]/knowledge/[id] — KB detail with Data Sources tab + Settings.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand } from "@/lib/supabase/database.types";
import { getKnowledgeBase } from "../actions";
import { KnowledgeDocumentUploader } from "@/components/admin/KnowledgeDocumentUploader";
import { KnowledgeBaseSettings } from "@/components/admin/KnowledgeBaseSettings";
import { KnowledgeDocumentTable } from "@/components/admin/KnowledgeDocumentTable";

export const dynamic = "force-dynamic";

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ brand: string; id: string }>;
}) {
  const { brand: slug, id } = await params;
  const supa = adminClient();
  const { data: brandRow } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = brandRow as unknown as Brand;
  const accent = brand.primary_color ?? "#6366f1";

  const result = await getKnowledgeBase(slug, id);
  if (!result) notFound();
  const { kb, documents } = result;

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <Link
            href={`/admin/${slug}/knowledge`}
            className="mb-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-white/40 transition hover:text-white/70"
          >
            <ArrowLeft size={12} /> All knowledge bases
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{kb.name}</h1>
          {kb.description && (
            <div className="mt-1 max-w-xl text-[12px] text-white/45">{kb.description}</div>
          )}
          <div className="mt-2 text-[11px] text-white/35">
            ID: <code className="rounded bg-white/[0.06] px-1.5 py-0.5">{kb.id}</code>
          </div>
        </div>
        <div className="text-end">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Documents</div>
          <div className="mt-0.5 text-2xl font-semibold tabular-nums text-white">{documents.length}</div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[14px] font-semibold text-white">Data Sources</div>
            <div className="mt-0.5 text-[11px] text-white/45">
              Phase 1 supports <code className="rounded bg-white/5 px-1">.txt</code> · <code className="rounded bg-white/5 px-1">.md</code> · <code className="rounded bg-white/5 px-1">.csv</code> · <code className="rounded bg-white/5 px-1">.json</code> (max 15 MB each).
            </div>
          </div>
          <KnowledgeDocumentUploader brandSlug={slug} kbId={kb.id} accent={accent} />
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <FileText size={26} className="text-white/25" strokeWidth={1.5} />
            <div className="text-[13px] font-medium text-white/65">No training sources found</div>
            <div className="text-[11px] text-white/35">Upload your first document to start populating this knowledge base.</div>
          </div>
        ) : (
          <KnowledgeDocumentTable brandSlug={slug} kbId={kb.id} documents={documents} />
        )}
      </div>

      {/* Settings (Phase 2 will start using these — surface them now so admins
          can configure ahead of the embed pipeline going live). */}
      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="mb-4">
          <div className="text-[14px] font-semibold text-white">Knowledge Base Settings</div>
          <div className="mt-0.5 text-[11px] text-white/45">
            Retrieval &amp; chunking parameters. Vector-search settings activate once Phase 2 ships the embed pipeline.
          </div>
        </div>
        <KnowledgeBaseSettings brandSlug={slug} kb={kb} accent={accent} />
      </div>
    </div>
  );
}
