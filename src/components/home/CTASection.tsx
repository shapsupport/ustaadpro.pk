"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gray-900 py-20 md:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-lime-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-green-500/10 blur-3xl" />
      </div>

      <div className="container-wide relative z-10 px-4 text-center md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-lime-500/10 px-4 py-2 border border-lime-500/20">
            <Sparkles className="h-4 w-4 text-lime-400" />
            <span className="text-sm font-medium text-lime-400">
              Available across 25+ cities
            </span>
          </div>

          <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Ready to fix your home?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
            Book a trusted professional today. Quality service, transparent
            pricing, and guaranteed satisfaction.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              render={<Link href="/services" />}
              nativeButton={false}
              size="lg"
              className="h-14 rounded-xl bg-lime-500 px-10 text-base font-semibold text-white hover:bg-lime-400 transition-all hover:scale-105"
            >
              Book a Professional
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              render={<Link href="/contact" />}
              nativeButton={false}
              variant="outline"
              size="lg"
              className="h-14 rounded-xl border-gray-700 px-10 text-base font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
            >
              Contact Us
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
