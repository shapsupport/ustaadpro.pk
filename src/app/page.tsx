import { AppLayout } from "@/components/home/AppLayout";
import { LocationGate } from "@/components/location/LocationGate";
import { getCatalog, getCategories, getLatestReviews, getServices, getServicesWithReviewStats } from "@/lib/server-api";

export default async function HomePage() {
  const [services, categories, catalog] = await Promise.all([getServices(), getCategories(), getCatalog()]);
  const [servicesWithReviews, reviews] = await Promise.all([
    getServicesWithReviewStats(services),
    getLatestReviews(services),
  ]);
  return (
    <LocationGate>
      <AppLayout initialServices={servicesWithReviews} categories={categories} catalog={catalog} reviews={reviews} />
    </LocationGate>
  );
}
