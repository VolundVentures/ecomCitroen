"use client";

import { motion } from "framer-motion";

/** Decorative animated background for the admin sign-in page.
 *  Two gentle orbs + a subtle grid mask. Pure CSS / framer-motion — no images. */
export function LoginAnimated() {
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[640px] w-[640px] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 60%)" }}
        animate={{ x: ["-50%", "-46%", "-52%", "-50%"], scale: [1, 1.05, 0.98, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-[-15%] right-[-10%] h-[520px] w-[520px] rounded-full blur-[130px]"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.22) 0%, transparent 60%)" }}
        animate={{ x: [0, -20, 10, 0], scale: [1, 1.04, 0.97, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-[40%] left-[-10%] h-[420px] w-[420px] rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 60%)" }}
        animate={{ x: [0, 24, -8, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
        }}
      />
      {/* Soft top vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)" }}
      />
    </>
  );
}
