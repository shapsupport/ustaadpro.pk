import type { Metadata } from "next";
import { ProfilePageClient } from "@/components/auth/ProfilePageClient";

export const metadata: Metadata = {
  title: "My Profile | UstaadPro",
  description: "Manage your UstaadPro account, bookings, wallet, and support requests.",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
