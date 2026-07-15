"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { MotionWrapper } from "@/components/motion/MotionWrapper";
import { motion } from "framer-motion";
import { Search, CalendarCheck, UserCheck, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Choose Service",
    description: "Browse our 24+ service categories and select what you need for your home.",
  },
  {
    icon: CalendarCheck,
    step: "02",
    title: "Select Time",
    description: "Pick a convenient date and time slot that works best for your schedule.",
  },
  {
    icon: UserCheck,
    step: "03",
    title: "Professional Arrives",
    description: "A verified, skilled professional arrives at your doorstep right on time.",
  },
  {
    icon: CheckCircle2,
    step: "04",
    title: "Job Completed",
    description: "Work gets done to perfection. Pay securely and rate your experience.",
  },
];

export function HowItWorks() {
  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <MotionWrapper>
          <SectionHeader
            badge="How It Works"
            title="Book in 4 simple steps"
            description="Getting professional help for your home has never been easier. Here's how it works."
          />
        </MotionWrapper>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-[4.5rem] hidden h-0.5 bg-gradient-to-r from-lime-200 via-lime-400 to-lime-200 md:block" />

          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative text-center"
              >
                {/* Step circle */}
                <div className="relative z-10 mx-auto mb-6 flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full bg-white border-2 border-lime-200 shadow-lime">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-50">
                    <step.icon className="h-7 w-7 text-lime-600" />
                  </div>
                </div>

                {/* Step number */}
                <span className="mb-2 inline-block text-xs font-bold uppercase tracking-widest text-lime-500">
                  Step {step.step}
                </span>

                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
