import RideScreen from "@/components/ride/RideScreen";
import { getDemoPhotos } from "@/lib/data";

export const metadata = { title: "spot · spotholes" };

export default async function RidePage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const { demo } = await searchParams;
  // the demo ride shows real rider frames, even though they are not from the spots it walks past
  const photos = demo === "1" ? await getDemoPhotos() : [];
  return <RideScreen demo={demo === "1"} demoPhotos={photos} />;
}
