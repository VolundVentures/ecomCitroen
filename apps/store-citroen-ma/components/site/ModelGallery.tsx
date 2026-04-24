"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type GalleryItem = {
  src: string;
  caption: string;
};

export function ModelGallery({
  items,
  modelName,
}: {
  items: GalleryItem[];
  modelName: string;
}) {
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];
  if (!current) return null;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="display text-3xl font-medium leading-tight sm:text-4xl">
            Photographies
          </h2>
          <div className="mt-1 text-sm text-[--brand-ink-muted]">
            Visuels officiels · {modelName}
          </div>
        </div>
        <div className="hidden gap-2 sm:flex">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={
                i === active
                  ? "h-2 w-8 rounded-full bg-[--brand-ink]"
                  : "h-2 w-2 rounded-full bg-[--brand-border] hover:bg-[--brand-ink-muted]"
              }
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.src}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative aspect-[21/10] overflow-hidden rounded-[28px] border border-[--brand-border] bg-black"
        >
          <Image
            src={current.src}
            alt={current.caption}
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="object-cover"
            priority={active === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <div className="display max-w-2xl text-xl font-medium sm:text-2xl">
              {current.caption}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Thumbs */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {items.map((g, i) => (
          <button
            key={g.src}
            type="button"
            onClick={() => setActive(i)}
            className={
              i === active
                ? "relative aspect-[4/3] overflow-hidden rounded-xl ring-2 ring-[--brand-ink] ring-offset-2"
                : "relative aspect-[4/3] overflow-hidden rounded-xl opacity-70 transition-opacity hover:opacity-100"
            }
          >
            <Image
              src={g.src}
              alt=""
              fill
              sizes="180px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
