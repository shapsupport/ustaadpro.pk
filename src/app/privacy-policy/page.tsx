import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Ustaad Pro",
  description: "Privacy policy and data protection guidelines for Ustaad Pro.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container-wide py-12 md:py-20">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm border border-gray-100 md:p-12">
        <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
          Privacy Policy
        </h1>

        <div className="space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">Your privacy matters</h2>
            <p>
              This page explains how Ustaad Pro uses the information needed to run
              bookings, shopping orders, account recovery, and notifications.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">Account information</h2>
            <p>
              We use your name, phone number, and email to create your account,
              verify access, process bookings, and contact you about service or
              shopping orders.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">Addresses and location</h2>
            <p>
              Saved addresses are used for service visits and store deliveries.
              Current location is used only when you choose to locate your address.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">Notifications</h2>
            <p>
              Push notifications are used for booking updates, shopping order status
              changes, and important service alerts from Ustaad Pro.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">Pricing model</h2>
            <p>
              By booking a service, you agree with the displayed pricing model,
              including service charges, inspection fees, platform charges, taxes,
              delivery fees, and any payment method shown before confirmation.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">Data protection</h2>
            <p>
              We keep account data linked to the signed-in user. Profile photos,
              addresses, orders, and reviews are not shared across different users.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">Deleting your account</h2>
            <p>
              To request account deletion, contact us from your registered email or
              include your registered phone number so we can verify the request.
            </p>
            <p className="mt-2">
              <strong className="text-gray-900">Email:</strong>{" "}
              <a href="mailto:ustaadpro.official26@gmail.com" className="text-lime-600 hover:underline font-medium">
                ustaadpro.official26@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">Contact</h2>
            <p>
              For privacy, pricing, support, or account deletion questions, contact
              Ustaad Pro at:{" "}
              <a href="mailto:ustaadpro.official26@gmail.com" className="text-lime-600 hover:underline font-medium">
                ustaadpro.official26@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
