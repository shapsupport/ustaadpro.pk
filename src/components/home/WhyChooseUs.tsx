"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { MotionWrapper, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrapper";
import {
  ShieldCheck,
  BadgeDollarSign,
  Clock,
  Siren,
  Lock,
  MapPin,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Professionals",
    description:
      "Every professional undergoes thorough background checks and skill verification before joining our platform.",
  },
  {
    icon: BadgeDollarSign,
    title: "Transparent Pricing",
    description:
      "No hidden charges. Get upfront pricing before you book with detailed cost breakdowns for every service.",
  },
  {
    icon: Clock,
    title: "Quick Booking",
    description:
      "Book a professional in under 2 minutes. Choose your time slot and get instant confirmation.",
  },
  {
    icon: Siren,
    title: "Emergency Services",
    description:
      "24/7 emergency support for urgent repairs. A professional can be at your door within the hour.",
  },
  {
    icon: Lock,
    title: "Secure Platform",
    description:
      "Your data is protected with enterprise-grade security. Secure payments and verified identities.",
  },
  {
    icon: MapPin,
    title: "Nationwide Expansion",
    description:
      "Available across 25+ cities in Pakistan and rapidly expanding to serve every corner of the country.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="section-padding bg-gray-50/50">
      <div className="container-wide">
        <MotionWrapper>
          <SectionHeader
            badge="Why Ustaad Pro"
            title="Why choose us?"
            description="We're building Pakistan's most trusted home services platform with quality, transparency, and speed at our core."
          />
        </MotionWrapper>

        <StaggerContainer
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.1}
        >
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-50 text-lime-500">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>


      </div>
    </section>
  );
}
