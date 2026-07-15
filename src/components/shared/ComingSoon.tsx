"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MotionWrapper } from "@/components/motion/MotionWrapper";
import { ArrowLeft, Rocket } from "lucide-react";

interface ComingSoonProps {
  title: string;
}

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50/50 section-padding">
      <div className="container-wide max-w-2xl text-center">
        <MotionWrapper>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-lime-100 text-lime-500">
            <Rocket className="h-10 w-10" />
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mb-8 text-lg text-gray-500">
            This page is currently under construction and will be launching soon. Check back later!
          </p>
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            size="lg"
            className="rounded-xl bg-lime-500 px-8 text-white hover:bg-lime-600 transition-all shadow-lime-lg hover:scale-105"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
        </MotionWrapper>
      </div>
    </div>
  );
}
