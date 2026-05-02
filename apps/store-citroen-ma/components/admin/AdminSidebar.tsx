"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessagesSquare,
  Users,
  BarChart3,
  Sparkles,
  Settings,
  ChevronDown,
  Wrench,
  AlertTriangle,
  Database,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Brand } from "@/lib/supabase/database.types";

type Props = {
  slug: string;
  brand: Brand;
  brands: Pick<Brand, "id" | "slug" | "name" | "logo_url" | "primary_color">[];
  accent: string;
};

export function AdminSidebar({ slug, brand, brands, accent }: Props) {
  const pathname = usePathname();
  const [pickerOpen, setPickerOpen] = useState(false);

  // After-sales sections only show on brands where APV is enabled. Today
  // that's jeep-ma only — Stellantis will validate the demo before we roll
  // RDV / complaints out to Citroën and Peugeot KSA.
  const apvEnabled = slug === "jeep-ma";
  const items = [
    { href: `/admin/${slug}`, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: `/admin/${slug}/conversations`, label: "Conversations", icon: MessagesSquare },
    { href: `/admin/${slug}/leads`, label: "Sales leads", icon: Users },
    ...(apvEnabled
      ? [
          { href: `/admin/${slug}/appointments`, label: "Appointments", icon: Wrench },
          { href: `/admin/${slug}/complaints`, label: "Complaints", icon: AlertTriangle },
        ]
      : []),
    { href: `/admin/${slug}/analytics`, label: "Analytics", icon: BarChart3 },
    { href: `/admin/${slug}/prompt`, label: "Prompt", icon: Sparkles },
    { href: `/admin/${slug}/knowledge`, label: "Knowledge", icon: Database },
    { href: `/admin/${slug}/settings`, label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden w-[252px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0a0c] lg:flex">
      <div className="px-4 pt-5 pb-4">
        <Link href="/admin" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/40 transition hover:text-white/70">
          <span>← All brands</span>
        </Link>
      </div>

      {/* Brand switcher */}
      <div className="relative px-3">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-start transition hover:bg-white/[0.07]"
        >
          {brand.logo_url ? (
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-white/10 p-1">
              <Image src={brand.logo_url} alt={brand.name} fill className="object-contain p-1" sizes="32px" />
            </div>
          ) : (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
              style={{ background: accent }}
            >
              {brand.name[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-semibold text-white">{brand.name}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{brand.market}</div>
          </div>
          <ChevronDown size={14} strokeWidth={2} className={`text-white/40 transition ${pickerOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-x-3 top-full z-30 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#101013] shadow-[0_18px_42px_-12px_rgba(0,0,0,0.6)]"
            >
              {brands.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/${b.slug}`}
                  onClick={() => setPickerOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-[12px] transition hover:bg-white/[0.06] ${
                    b.slug === slug ? "bg-white/[0.04] text-white" : "text-white/70"
                  }`}
                >
                  {b.logo_url ? (
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-sm bg-white/10 p-0.5">
                      <Image src={b.logo_url} alt={b.name} fill className="object-contain p-0.5" sizes="24px" />
                    </div>
                  ) : (
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-[9px] font-bold text-white"
                      style={{ background: b.primary_color ?? "#374151" }}
                    >
                      {b.name[0]}
                    </div>
                  )}
                  <span className="truncate">{b.name}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="mt-3 flex flex-col gap-0.5 px-2">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${
                active ? "bg-white/[0.07] text-white" : "text-white/55 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav-pill"
                  className="absolute inset-y-1.5 start-0 w-[3px] rounded-full"
                  style={{ background: accent }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={15} strokeWidth={1.85} className="shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 py-4 text-[10px] uppercase tracking-[0.22em] text-white/30">
        Stellantis Demo · v0.1
      </div>
    </aside>
  );
}
