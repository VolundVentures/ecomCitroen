// Per-brand admin shell: persistent sidebar, brand switcher, sign-out.

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand } from "@/lib/supabase/database.types";
import { logoutAction } from "../actions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

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
  const [brandRes, allBrandsRes] = await Promise.all([
    supa.from("brands").select("*").eq("slug", slug).single(),
    supa.from("brands").select("id, slug, name, logo_url, primary_color").eq("enabled", true).order("name"),
  ]);
  const brand = brandRes.data as unknown as Brand | null;
  const brands = (allBrandsRes.data as unknown as Pick<Brand, "id" | "slug" | "name" | "logo_url" | "primary_color">[]) ?? [];
  if (!brand) notFound();

  const accent = brand.primary_color ?? "#6366f1";

  return (
    <div className="flex min-h-screen bg-[#08080b] text-white">
      <AdminSidebar slug={slug} brand={brand} brands={brands} accent={accent} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#08080b]/80 px-8 py-3.5 backdrop-blur">
          <div className="flex items-center gap-3">
            {brand.logo_url && (
              <div className="relative h-7 w-7 overflow-hidden rounded-md bg-white/10 p-1">
                <Image src={brand.logo_url} alt={brand.name} fill className="object-contain p-1" sizes="28px" />
              </div>
            )}
            <div className="leading-tight">
              <div className="text-[13px] font-semibold">{brand.name}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{slug} · {brand.market}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/demo/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/70 transition hover:border-white/30 hover:text-white"
            >
              Open demo ↗
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="rounded-full border border-transparent px-3 py-1.5 text-[11px] text-white/40 transition hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
