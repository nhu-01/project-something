"use client";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

// A number that counts up the first time it scrolls into view. The real value is always in the markup.
export default function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduce || value === 0) return;
    const controls = animate(0, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => { el.textContent = v.toFixed(decimals); } });
    return () => { controls.stop(); el.textContent = value.toFixed(decimals); };
  }, [inView, reduce, value, decimals]);
  return <span ref={ref} className="tabular-nums">{value.toFixed(decimals)}</span>;
}
