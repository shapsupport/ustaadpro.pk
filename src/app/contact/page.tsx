"use client";

import { Mail, Phone, MapPin, Send, LoaderCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const payload = {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      setFeedback({ type: "error", message: "Please complete your name, email address, and message." });
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Your message could not be sent. Please try again.");

      setFeedback({ type: "success", message: data.message || "Your message has been sent successfully. We will contact you soon." });
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Your message could not be sent. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Contact Us
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight">
            We are here to help you
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Have a question, feedback, or need help with a booking? Get in touch with us anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* Info Side (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Phone Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-start gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Call / WhatsApp</h3>
                <a href="tel:+923719201273" className="text-slate-600 text-sm font-medium transition hover:text-primary">+92 371 9201273</a>
                <p className="text-xs text-slate-400 mt-1">Mon-Sun: 9:00 AM - 9:00 PM</p>
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-start gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 mb-1">Email Address</h3>
                <a href="mailto:ustaadpro.official26@gmail.com" className="block truncate text-sm font-medium text-slate-600 transition hover:text-primary">ustaadpro.official26@gmail.com</a>
                <p className="text-xs text-slate-400 mt-1">Average response time: 2 hours</p>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-start gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Office Location</h3>
                <a href="https://maps.app.goo.gl/N7Hn1o8pupSz3iQ69" target="_blank" rel="noopener noreferrer" className="text-slate-600 text-sm font-medium transition hover:text-primary">Sharplogicians Agile Center, Building # 153-M, Office # 32, 4th Floor, D-Block Civic Center, Phase 4, Bahria Town, Islamabad 46220, Pakistan</a>
                <p className="text-xs text-slate-400 mt-1">View our office on Google Maps</p>
              </div>
            </div>
          </div>

          {/* Form Side (3 cols) */}
          <div className="md:col-span-3 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Send us a message</h2>
            <p className="text-slate-400 text-sm mb-6">Fill out the form below and our team will get back to you shortly.</p>

            {feedback && (
              <div role="status" aria-live="polite" className={`text-sm rounded-2xl p-4 mb-6 flex items-start gap-2 ${feedback.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-800" : "bg-red-50 border border-red-100 text-red-800"}`}>
                {feedback.type === "success" ? <CheckSuccessIcon /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />}
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (feedback?.type === "error") setFeedback(null); }}
                  placeholder="e.g. Muhammad Ali"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (feedback?.type === "error") setFeedback(null); }}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); if (feedback?.type === "error") setFeedback(null); }}
                  placeholder="How can we help you?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-800 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send Message"}
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckSuccessIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
