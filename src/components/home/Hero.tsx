"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingElements } from "@/components/shared/FloatingElements";
import { ArrowRight, Play } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden hero-gradient">
      <FloatingElements />

      <div className="container-wide relative z-10 px-4 py-20 md:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">


          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Professional home services
            <span className="block mt-2">
              at your{" "}
              <span className="gradient-text">doorstep</span>
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 md:text-xl leading-relaxed"
          >
            Book verified electricians, plumbers, AC technicians, painters,
            cleaners, carpenters, CCTV experts and more — in minutes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Button
              render={<Link href="/services" />}
              nativeButton={false}
              size="lg"
              className="h-14 rounded-xl bg-lime-500 px-8 text-base font-semibold text-white shadow-lime-lg hover:bg-lime-600 transition-all hover:scale-105"
            >
              Book a Service
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              render={<Link href="/store" />}
              nativeButton={false}
              variant="outline"
              size="lg"
              className="h-14 rounded-xl border-gray-200 px-8 text-base font-semibold hover:bg-lime-50 hover:border-lime-300 transition-all"
            >
              <Play className="mr-2 h-4 w-4 fill-lime-500 text-lime-500" />
              Browse Store
            </Button>
          </motion.div>


        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
