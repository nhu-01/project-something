import MapExplorer from "@/components/map/MapExplorer";
import { getCityReports, getPotholes, getTracks } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "map · spotholes" };

export default async function MapPage() {
  const [potholes, tracks, city] = await Promise.all([getPotholes(), getTracks(), getCityReports()]);
  return <MapExplorer potholes={potholes} tracks={tracks} city={city} />;
}
