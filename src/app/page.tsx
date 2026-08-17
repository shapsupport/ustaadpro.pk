import { AppLayout } from "@/components/home/AppLayout";
import { LocationGate } from "@/components/location/LocationGate";
import { getCategories, getLatestReviews, getServices } from "@/lib/server-api";
import { orderServices } from "@/lib/service-order";

export default async function HomePage() {
  const [services, categories] = await Promise.all([getServices(), getCategories()]);
  const orderedServices = orderServices(services);
  const reviewedServices = orderedServices.filter((service) => Number(service.reviews || 0) > 0);
  const homepageServices = [...new Map(
    [...reviewedServices.slice(0, 3), ...orderedServices.slice(0, 8)].map((service) => [service.id, service])
  ).values()];
  // The cards already include aggregate rating data. Only inspect a small
  // featured sample for testimonials instead of hitting reviews for every service.
  const reviews = await getLatestReviews(reviewedServices.slice(0, 4));
  return (
    <LocationGate>
      <AppLayout initialServices={homepageServices} categories={categories} catalog={[]} reviews={reviews} />
    </LocationGate>
  );
}
