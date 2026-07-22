import { AppLayout } from "@/components/home/AppLayout";
import { LocationGate } from "@/components/location/LocationGate";
import { getCategories, getLatestReviews, getServices } from "@/lib/server-api";

export default async function HomePage() {
  const [services, categories] = await Promise.all([getServices(), getCategories()]);
  const reviews = await getLatestReviews(services);
  return (
    <LocationGate>
      <AppLayout initialServices={services} categories={categories} reviews={reviews} />
    </LocationGate>
  );
}
