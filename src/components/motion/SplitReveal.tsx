"use client";
import { motion, useReducedMotion } from "motion/react";

// Headline that rises into place one word at a time. Put the plain sentence in aria-label on the heading that
// wraps this: the animated words themselves are hidden from screen readers.
export default function SplitReveal({ lines, className, delay = 0 }: { lines: string[]; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  let n = 0;
  return (
    <span className={className}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden>
          {line.split(" ").map((word, wi) => {
            const i = n++;
            return (
              <span key={wi} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
                <motion.span
                  className="inline-block"
                  initial={reduce ? { opacity: 0 } : { y: "110%", rotate: 4 }}
                  animate={reduce ? { opacity: 1 } : { y: 0, rotate: 0 }}
                  transition={{ duration: reduce ? 0.4 : 0.9, delay: delay + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                >
                  {word}{wi < line.split(" ").length - 1 ? " " : ""}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}
