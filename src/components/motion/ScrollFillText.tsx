"use client";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return <motion.span style={{ opacity }} className="inline-block">{children}&nbsp;</motion.span>;
}

// A sentence that inks in word by word as you scroll through it.
export default function ScrollFillText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.4"] });
  const words = text.split(" ");
  if (reduce) return <h2 className={className}>{text}</h2>;
  return (
    <h2 ref={ref} className={className} aria-label={text}>
      <span aria-hidden>
        {words.map((w, i) => <Word key={i} progress={scrollYProgress} range={[i / words.length, Math.min(1, (i + 1.5) / words.length)]}>{w}</Word>)}
      </span>
    </h2>
  );
}
