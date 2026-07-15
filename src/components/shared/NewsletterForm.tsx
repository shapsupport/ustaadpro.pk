"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

interface NewsletterFormProps {
  className?: string;
  variant?: "default" | "inline";
}

export function NewsletterForm({ className, variant = "default" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setEmail("");
      }, 3000);
    }
  };

  if (submitted) {
    return (
      <div className={`flex items-center gap-2 text-lime-600 ${className}`}>
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium">Thank you! We&apos;ll keep you updated.</span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
        <Button type="submit" className="bg-lime-500 hover:bg-lime-600 text-white shrink-0">
          Subscribe
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 pl-10 text-base"
            required
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 bg-lime-500 px-8 hover:bg-lime-600 text-white"
        >
          Subscribe
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-sm text-gray-400">
        No spam, unsubscribe at any time.
      </p>
    </form>
  );
}
