"use client";

import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName("");
    setEmail("");
    setMessage("");
    setTimeout(() => setSubmitted(false), 5000);
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
                <p className="text-slate-600 text-sm font-medium">+92 371 9201273</p>
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
                <p className="text-slate-600 text-sm font-medium truncate">ustaadpro.official26@gmail.com</p>
                <p className="text-xs text-slate-400 mt-1">Average response time: 2 hours</p>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-start gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Head Office</h3>
                <p className="text-slate-600 text-sm font-medium">Rawalpindi &amp; Islamabad, Pakistan</p>
                <p className="text-xs text-slate-400 mt-1">Providing services across Twin Cities</p>
              </div>
            </div>
          </div>

          {/* Form Side (3 cols) */}
          <div className="md:col-span-3 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Send us a message</h2>
            <p className="text-slate-400 text-sm mb-6">Fill out the form below and our team will get back to you shortly.</p>

            {submitted && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm rounded-2xl p-4 mb-6 flex items-center gap-2">
                <CheckSuccessIcon />
                Your message has been sent successfully! We will contact you soon.
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
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Abdullah Siraj"
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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-800 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20"
              >
                Send Message
                <Send className="h-4 w-4" />
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
