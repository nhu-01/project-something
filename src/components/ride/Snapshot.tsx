"use client";
import { motion, useReducedMotion } from "motion/react";

// The "got it" moment: a quick flash, then the exact frame that was saved appears like a print and flies up into the
// counter. `aspect` is the camera's width/height, used to crop away the gray padding the detector frame carries.
export default function Snapshot({ src, aspect }: { src: string; aspect: number }) {
  const reduce = useReducedMotion();
  const ease = [0.16, 1, 0.3, 1] as const;
  if (reduce) {
    return (
      <motion.div aria-hidden className="pointer-events-none absolute left-1/2 top-[36%] w-[44%] max-w-[210px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] border-4 border-paper"
        style={{ aspectRatio: aspect }} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 1.8, times: [0, 0.15, 0.8, 1] }}>
        <img src={src} alt="" className="h-full w-full object-cover" />
      </motion.div>
    );
  }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {/* shutter flash */}
      <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} />
      {/* viewfinder brackets snap inward */}
      <motion.div className="absolute inset-[9%] rounded-[28px] border-2 border-paper/90" initial={{ scale: 1.12, opacity: 0 }} animate={{ scale: [1.12, 1, 1], opacity: [0, 1, 0] }} transition={{ duration: 0.7, times: [0, 0.35, 1], ease }} />
      {/* the print: lands, holds, then flies to the counter in the top right */}
      <motion.div
        className="absolute left-1/2 top-[36%] w-[44%] max-w-[210px] overflow-hidden rounded-[20px] border-4 border-paper shadow-[0_18px_50px_rgb(0_0_0/0.45)]"
        style={{ aspectRatio: aspect }}
        initial={{ x: "-50%", y: "-50%", scale: 1.3, opacity: 0, rotate: 0 }}
        animate={{ x: ["-50%", "-50%", "-50%", "62%"], y: ["-50%", "-50%", "-50%", "-215%"], scale: [1.3, 1, 1, 0.14], opacity: [0, 1, 1, 0], rotate: [0, -3, -3, 10] }}
        transition={{ duration: 1.9, times: [0, 0.16, 0.7, 1], ease }}
      >
        <img src={src} alt="" className="h-full w-full object-cover" />
      </motion.div>
    </div>
  );
}
