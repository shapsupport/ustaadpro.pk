"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { MotionWrapper, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrapper";
import { services } from "@/data/services";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

function getIcon(iconName: string): LucideIcon {
  return (LucideIcons as unknown as Record<string, LucideIcon>)[iconName] || LucideIcons.Wrench;
}

export function ServiceCategories() {
  return (
    <section className="section-padding bg-white" id="services">
      <div className="container-wide">
        <MotionWrapper>
          <SectionHeader
            badge="Our Services"
            title="Everything your home needs"
            description="From electrical repairs to interior design, we've got every home service covered with verified professionals."
          />
        </MotionWrapper>

        <StaggerContainer
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          staggerDelay={0.05}
        >
          {services.map((service) => {
            const Icon = getIcon(service.icon);
            return (
              <StaggerItem key={service.id}>
                <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-lime-200 hover:shadow-lg hover:-translate-y-1">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-lime-50 text-lime-500 transition-colors group-hover:bg-lime-500 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {service.title}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-gray-500 line-clamp-2">
                    {service.description}
                  </p>
                  <Button
                    render={<Link href={`/services#${service.slug}`} />}
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-lime-600 hover:text-lime-700 hover:bg-transparent font-semibold"
                  >
                    Book Now →
                  </Button>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
