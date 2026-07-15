"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { MotionWrapper, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrapper";
import { testimonials } from "@/data/testimonials";
import { Star, Quote } from "lucide-react";

export function CustomerReviews() {
  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <MotionWrapper>
          <SectionHeader
            badge="Testimonials"
            title="What our customers say"
            description="Don't just take our word for it. Hear from homeowners who trust Ustaad Pro."
          />
        </MotionWrapper>

        <StaggerContainer
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.1}
        >
          {testimonials.map((review) => (
            <StaggerItem key={review.id}>
              <div className="relative rounded-2xl bg-white border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                {/* Quote icon */}
                <Quote className="absolute top-6 right-6 h-8 w-8 text-lime-100" />

                {/* Stars */}
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>

                {/* Review text */}
                <p className="flex-1 text-gray-600 leading-relaxed mb-6">
                  &ldquo;{review.review}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 border-t border-gray-50 pt-5">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-lime-200 to-lime-400 flex items-center justify-center text-sm font-bold text-white">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {review.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {review.location} • {review.service}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
