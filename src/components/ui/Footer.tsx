export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      {/* a quiet nod to the subway map */}
      <div className="wrap flex gap-1.5 pt-8" aria-hidden>
        {["red", "green", "purple", "blue", "orange", "lime", "brown", "gray", "yellow", "slate", "teal"].map((c) => <span key={c} className="h-2 w-2 rounded-full" style={{ background: `var(--line-${c})` }} />)}
      </div>
      <div className="wrap flex flex-col gap-3 pb-8 pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>spotholes.nyc · an independent project, not affiliated with the city of new york</span>
        <span>severity and size are ai estimates · never handle your phone while moving</span>
      </div>
    </footer>
  );
}
