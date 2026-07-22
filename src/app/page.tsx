import { AppLayout } from "@/components/home/AppLayout";
import { LocationGate } from "@/components/location/LocationGate";
import { getCategories, getLatestReviews, getServices, getServicesWithReviewStats } from "@/lib/server-api";

export default async function HomePage() {
  const [services, categories] = await Promise.all([getServices(), getCategories()]);
  const [reviewedServices, reviews] = await Promise.all([getServicesWithReviewStats(services), getLatestReviews(services)]);
  return (
    <LocationGate>
      <AppLayout initialServices={reviewedServices} categories={categories} reviews={reviews} />
    </LocationGate>
  );
}
