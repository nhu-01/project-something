const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const ArrowUpRight = () => (<svg {...p}><path d="M7 17 17 7M8 7h9v9" /></svg>);
export const Close = () => (<svg {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const Search = () => (<svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.5-3.5" /></svg>);
export const Pause = () => (<svg {...p}><path d="M9 6v12M15 6v12" /></svg>);
export const Check = () => (<svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
export const Flashlight = () => (<svg {...p}><path d="M8 3h8v4l-2 3v10a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V10L8 7V3Z" /><path d="M8 7h8M12 13v2" /></svg>);
export const Camera = () => (<svg {...p}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></svg>);
export const Pin = () => (<svg {...p}><path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
export const Locate = () => (<svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /><circle cx="12" cy="12" r="7.5" /></svg>);
export const Upload = () => (<svg {...p}><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>);
export const Mic = () => (<svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>);
export const Navigate = ({ className }: { className?: string }) => (<svg {...p} className={className}><path d="M12 3 5 20l7-4 7 4-7-17Z" /></svg>);
export const Volume = () => (<svg {...p}><path d="M4 10v4h4l5 4V6L8 10H4Z" /><path d="M16.5 9a4 4 0 0 1 0 6" /></svg>);
