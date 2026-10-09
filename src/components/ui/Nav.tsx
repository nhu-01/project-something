import Link from "next/link";

export default function Nav() {
  return (
    <header className="sticky top-0 z-[1500] border-b border-transparent bg-paper/80 backdrop-blur-md">
      <nav className="wrap flex h-16 items-center justify-between" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 text-[17px] font-medium tracking-tight">
          <span className="grid h-6 w-6 place-items-center rounded-full border border-ink" aria-hidden>
            <span className="logo-dot h-2.5 w-2.5 rounded-full" />
          </span>
          spotholes
        </Link>
        <div className="flex items-center gap-1 text-[15px]">
          <Link href="/map" className="rounded-full px-3 py-2 text-muted transition-colors hover:text-ink">map</Link>
          <Link href="/report" className="hidden rounded-full px-3 py-2 text-muted transition-colors hover:text-ink sm:block">report</Link>
          <Link href="/stats" className="hidden rounded-full px-3 py-2 text-muted transition-colors hover:text-ink sm:block">progress</Link>
          <Link href="/ride" className="pill pill-ink ml-2 !min-h-10 !px-4 whitespace-nowrap text-sm">start a ride</Link>
        </div>
      </nav>
    </header>
  );
}
