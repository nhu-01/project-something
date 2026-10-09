"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export type SwapWord = { text: string; color: string };

// One slot in a sentence that flips through words, like a departure board. Each word gets a line-color dot.
export default function WordSwap({ words, every = 2200 }: { words: SwapWord[]; every?: number }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => { if (!document.hidden) setI((n) => (n + 1) % words.length); }, every);
    return () => clearInterval(t);
  }, [reduce, words.length, every]);

  const all = words.map((w) => w.text).join(", ");
  if (reduce) return <span>{all}</span>;
  const w = words[i];
  return (
    <span className="relative inline-flex h-[1.5em] items-center overflow-hidden align-bottom">
      <span className="sr-only">{all}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={w.text} aria-hidden
          className="inline-flex items-center gap-2 whitespace-nowrap font-medium text-ink"
          initial={{ y: "90%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-90%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: w.color }} />{w.text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
