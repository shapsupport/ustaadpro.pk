"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { MotionWrapper, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrapper";
import { Badge } from "@/components/ui/badge";
import { professionals } from "@/data/professionals";
import { Star, Briefcase, MapPin, BadgeCheck } from "lucide-react";

export function FeaturedProfessionals() {
  return (
    <section className="section-padding bg-gray-50/50">
      <div className="container-wide">
        <MotionWrapper>
          <SectionHeader
            badge="Our Experts"
            title="Meet our top professionals"
            description="Skilled, verified, and ready to deliver exceptional service at your doorstep."
          />
        </MotionWrapper>

        <StaggerContainer
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.1}
        >
          {professionals.map((pro) => (
            <StaggerItem key={pro.id}>
              <div className="group overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-lime-200 to-lime-400 flex items-center justify-center text-2xl font-bold text-white">
                      {pro.name.charAt(0)}
                    </div>
                    {pro.isVerified && (
                      <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5">
                        <BadgeCheck className="h-5 w-5 text-lime-500 fill-lime-500" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {pro.name}
                      </h3>
                    </div>
                    <p className="text-sm text-lime-600 font-medium">
                      {pro.specialty}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {pro.location}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-5 flex items-center justify-between rounded-xl bg-gray-50 p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-bold text-gray-900">{pro.rating}</span>
                    </div>
                    <span className="text-xs text-gray-500">Rating</span>
                  </div>
                  <div className="h-8 w-px bg-gray-200" />
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-bold text-gray-900">{pro.completedJobs}</span>
                    </div>
                    <span className="text-xs text-gray-500">Jobs</span>
                  </div>
                  <div className="h-8 w-px bg-gray-200" />
                  <div className="text-center">
                    <span className="text-lg font-bold text-gray-900">{pro.experience}</span>
                    <br />
                    <span className="text-xs text-gray-500">Experience</span>
                  </div>
                </div>

                {pro.isVerified && (
                  <Badge className="mt-4 bg-lime-50 text-lime-600 border-lime-200 hover:bg-lime-100">
                    <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                    Verified Professional
                  </Badge>
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
