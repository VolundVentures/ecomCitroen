// Per-brand admin layout: header with brand name, tab nav, sign-out.

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand } from "@/lib/supabase/database.types";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function BrandAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ brand: string }>;
}) {
  const { brand: slug } = await params;
  const supa = adminClient();
  const { data } = await supa.from("brands").select("*").eq("slug", slug).single();
  const brand = data as unknown as Brand | null;
  if (!brand) notFound();

  return (
    <div className="min-h-screen bg-[#0c0c10] text-white">
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-[11px] text-white/40 hover:text-white">← All brands</Link>
          <span className="text-white/20">/</span>
          {brand.logo_url && (
            <div className="relative h-7 w-7 overflow-hidden rounded-md bg-white/10 p-1">
              <Image src={brand.logo_url} alt={brand.name} fill className="object-contain p-1" sizes="28px" />
            </div>
          )}
          <div className="text-sm font-medium">{brand.name}</div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-[12px] text-white/40 hover:text-white">Sign out</button>
        </form>
      </header>

      <nav className="border-b border-white/5 px-6">
        <div className="flex gap-6">
          <TabLink href={`/admin/${slug}/conversations`} label="Conversations" />
          <TabLink href={`/admin/${slug}/analytics`} label="Analytics" />
          <TabLink href={`/admin/${slug}/prompt`} label="Prompt" />
          <a
            href={`/demo/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ms-auto py-3 text-[12px] text-white/40 transition hover:text-white"
          >
            Open demo ↗
          </a>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}

function TabLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="border-b-2 border-transparent px-1 py-3 text-sm text-white/60 transition hover:border-white/30 hover:text-white"
    >
      {label}
    </Link>
  );
}
