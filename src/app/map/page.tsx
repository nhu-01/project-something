import MapExplorer from "@/components/map/MapExplorer";
import { getPotholes, getTracks } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "map · spotholes" };

export default async function MapPage() {
  const [potholes, tracks] = await Promise.all([getPotholes(), getTracks()]);
  return <MapExplorer potholes={potholes} tracks={tracks} />;
}
