import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about Ustaad Pro service bookings, product orders, payments, locations, and support.",
};

const FAQS = [
  { question: "Which locations do you currently serve?", answer: "Ustaad Pro currently serves Islamabad and Rawalpindi. Select your city and locality from the location picker to confirm and save your area." },
  { question: "Will my selected location remain saved?", answer: "Yes. Your selected city and locality are saved on your device and remain available when you open service details or proceed to checkout. You can change the location at any time." },
  { question: "How do I book a service?", answer: "Choose a service, select the required work option when available, press Book Now, then provide your address, preferred date, time, and payment method." },
  { question: "How do I order a shop product?", answer: "Open a product, choose the quantity, press Buy Now, and complete the product checkout with your delivery address and payment method." },
  { question: "Are product and service checkouts separate?", answer: "Yes. Product delivery and professional service bookings use separate checkout flows so each order receives the correct address, schedule, charges, and confirmation." },
  { question: "Can I search the full catalog?", answer: "Yes. Homepage and services searches return services only, while the store search returns shop products only. Store category filters can further narrow the results." },
  { question: "How are service prices calculated?", answer: "The selected service price, applicable service tax, and inspection fee are shown in the checkout summary before you place the booking request." },
  { question: "How can I track a booking?", answer: "Use the Track Booking page from the main navigation and enter the relevant booking details to review its current status." },
];

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><HelpCircle className="h-7 w-7" /></div>
          <h1 className="mt-5 text-3xl font-black text-slate-950 sm:text-5xl">Frequently asked questions</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">Clear answers about locations, service bookings, shop orders, checkout, and support.</p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq, index) => (
            <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-white shadow-sm" open={index === 0}>
              <summary className="cursor-pointer list-none px-5 py-4 font-bold text-slate-900 marker:hidden sm:px-6">{faq.question}<span className="float-right text-xl text-emerald-600 transition-transform group-open:rotate-45">+</span></summary>
              <p className="border-t border-slate-100 px-5 py-4 text-sm leading-7 text-slate-600 sm:px-6">{faq.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl bg-slate-900 p-6 text-center sm:flex-row sm:text-left">
          <div><h2 className="font-black text-white">Still need help?</h2><p className="mt-1 text-sm text-slate-400">Send our support team your question.</p></div>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-white hover:bg-emerald-400"><MessageCircle className="h-4 w-4" />Contact support</Link>
        </div>
      </div>
    </div>
  );
}
