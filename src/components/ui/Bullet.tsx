import type { Severity } from "@/lib/data/types";
import { SEV_DARK_TEXT, SEV_VAR, SEV_WORD } from "@/lib/tokens";

// Subway-style bullet. Decorative by default; give it a label when it carries meaning on its own.
export function Bullet({ children, color, dark, large, label }: { children: React.ReactNode; color: string; dark?: boolean; large?: boolean; label?: string }) {
  return (
    <span className={`bullet${large ? " bullet-lg" : ""}${dark ? " bullet-dark" : ""}`} style={{ background: color }} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {children}
    </span>
  );
}

export function SeverityBullet({ value, large }: { value: Severity; large?: boolean }) {
  return <Bullet color={SEV_VAR[value]} dark={SEV_DARK_TEXT[value]} large={large} label={`severity ${value} of 5, ${SEV_WORD[value]}`}>{value}</Bullet>;
}
