"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteDocument } from "@/app/admin/[brand]/knowledge/actions";

type Props = {
  brandSlug: string;
  kbId: string;
  id: string;
  name: string;
};

export function KnowledgeDocumentDeleteButton({ brandSlug, kbId, id, name }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function destroy() {
    if (!confirm(`Delete "${name}"? The original file is removed from Storage too.`)) return;
    const fd = new FormData();
    fd.set("brandSlug", brandSlug);
    fd.set("kbId", kbId);
    fd.set("id", id);
    startTransition(async () => {
      try {
        await deleteDocument(fd);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={destroy}
      disabled={pending}
      className="rounded-md p-1.5 text-white/35 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
      title="Delete document"
      aria-label="Delete document"
    >
      <Trash2 size={13} strokeWidth={1.8} />
    </button>
  );
}
