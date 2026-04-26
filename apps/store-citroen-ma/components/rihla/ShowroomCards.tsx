"use client";

import { motion } from "framer-motion";
import { ExternalLink, MapPin, Phone, Clock, MessageCircle, Star } from "lucide-react";
import type { ShowroomItem } from "@/lib/rihla-actions";

export function ShowroomCards({
  items,
  city,
  accent,
}: {
  items: ShowroomItem[];
  city?: string;
  accent: string;
}) {
  if (items.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 0.68, 0, 1] }}
      className="flex items-end gap-2"
    >
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/rihla-avatar.jpg" alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-black/50">
          {items.length} showroom{items.length > 1 ? "s" : ""} {city ? `· ${city}` : ""}
        </div>
        <div className="space-y-1.5">
          {items.slice(0, 4).map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="overflow-hidden rounded-2xl rounded-bl-md bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-start gap-2.5 px-3.5 py-3">
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{ background: `${accent}15`, color: accent }}
                >
                  <MapPin size={13} strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className="truncate text-[13px] font-semibold text-[#0c0c10]">{s.name}</div>
                    {s.primary_dealer && (
                      <span
                        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                        style={{ background: `${accent}18`, color: accent }}
                      >
                        <Star size={9} strokeWidth={2.2} fill={accent} stroke="none" /> Flagship
                      </span>
                    )}
                  </div>
                  {s.address && (
                    <div className="mt-0.5 line-clamp-1 text-[11.5px] text-black/55">{s.address}</div>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-black/55">
                    {s.phone && (
                      <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 transition hover:text-black/85">
                        <Phone size={10} strokeWidth={2} />
                        <bdi dir="ltr">{s.phone}</bdi>
                      </a>
                    )}
                    {s.whatsapp && (
                      <a
                        href={`https://wa.me/${s.whatsapp.replace(/[\s+]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 transition hover:text-emerald-600"
                      >
                        <MessageCircle size={10} strokeWidth={2} /> WhatsApp
                      </a>
                    )}
                    {s.hours && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={10} strokeWidth={2} />
                        {s.hours}
                      </span>
                    )}
                  </div>
                </div>
                {s.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${s.name} ${s.address}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in Google Maps"
                    className="ms-1 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-black/40 transition hover:bg-black/[0.04] hover:text-black/80"
                  >
                    <ExternalLink size={12} strokeWidth={2} />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
