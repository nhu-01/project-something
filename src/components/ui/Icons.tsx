const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const ArrowUpRight = () => (<svg {...p}><path d="M7 17 17 7M8 7h9v9" /></svg>);
export const Close = () => (<svg {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const Search = () => (<svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.5-3.5" /></svg>);
export const Pause = () => (<svg {...p}><path d="M9 6v12M15 6v12" /></svg>);
export const Check = () => (<svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
export const Volume = () => (<svg {...p}><path d="M4 10v4h4l5 4V6L8 10H4Z" /><path d="M16.5 9a4 4 0 0 1 0 6" /></svg>);
