"use client";
import dynamic from "next/dynamic";

// Leaflet needs `window`, so the map loads in the browser only.
const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => <div className="h-full w-full bg-sage/30" aria-hidden /> });
export default MapView;
