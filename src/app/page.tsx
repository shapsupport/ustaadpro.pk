import { AppLayout } from "@/components/home/AppLayout";
import { LocationGate } from "@/components/location/LocationGate";
import { getCategories, getServices } from "@/lib/server-api";

export default async function HomePage() {
  const [services, categories] = await Promise.all([getServices(), getCategories()]);
  return (
    <LocationGate>
      <AppLayout initialServices={services} categories={categories} />
    </LocationGate>
  );
}
