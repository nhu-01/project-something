import MapExplorer from "@/components/map/MapExplorer";
import { getPotholes } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "map · spotholes" };

export default async function MapPage() {
  const potholes = await getPotholes();
  return <MapExplorer potholes={potholes} />;
}
