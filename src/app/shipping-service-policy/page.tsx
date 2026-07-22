import type { Metadata } from "next";
import { PolicyContact, PolicyList, PolicyPage, PolicySection } from "@/components/shared/PolicyPage";

export const metadata: Metadata = {
  title: "Shipping and Service Policy | Ustaad Pro",
  description: "Product delivery and booked-service fulfilment terms for Ustaad Pro customers in Pakistan.",
};

export default function ShippingServicePolicyPage() {
  return (
    <PolicyPage title="Shipping and Service Policy" description="This policy covers delivery of store products and the scheduling and fulfilment of home-service bookings in Pakistan.">
      <PolicySection title="1. Service area and order processing">
        <p>We deliver products and provide services only to locations shown as available during checkout or confirmed by support. Availability may differ by product, city, postal code, and professional coverage. Orders are normally processed on business days after payment or order verification.</p>
      </PolicySection>

      <PolicySection title="2. Shipping charges and delivery estimates">
        <p>Available shipping method, fee, and estimated delivery period will be displayed at checkout or communicated before acceptance. Charges may depend on weight, dimensions, value, destination, and special handling. Any mandatory charge known at checkout will be disclosed before you confirm the order.</p>
        <p>Delivery dates are estimates unless we expressly state a guaranteed date in writing. Weather, public holidays, road closures, security conditions, courier disruption, remote-area routing, or supply delays may affect delivery. We will communicate a material known delay and offer available options.</p>
      </PolicySection>

      <PolicySection title="3. Delivery and inspection">
        <PolicyList>
          <li>Provide a complete address, active Pakistani phone number, landmarks where needed, and an authorized recipient.</li>
          <li>The courier may contact you and may request reasonable proof of identity or an order code.</li>
          <li>Inspect the outer parcel before acceptance where the courier permits. Do not accept a visibly tampered parcel without noting the issue or contacting support.</li>
          <li>After delivery, check the contents promptly and report damage, shortage, or a wrong item under the Return &amp; Refund Policy.</li>
        </PolicyList>
      </PolicySection>

      <PolicySection title="4. Failed delivery and address changes">
        <p>If delivery fails because the address or phone number is incorrect, the recipient is unavailable, access is refused, or cash-on-delivery payment is not ready, we may attempt redelivery or return the parcel. A reasonable, disclosed redelivery or return-to-origin charge may apply.</p>
        <p>Request address changes before dispatch. We cannot promise a change after dispatch. If an order is returned to us, any approved product refund will follow the Return &amp; Refund Policy and may exclude delivery and return courier costs where lawful.</p>
      </PolicySection>

      <PolicySection title="5. Title, risk, and restricted items">
        <p>Risk transfers on delivery to you or your authorized recipient, except where applicable law provides otherwise. We may use different couriers or separate a multi-item order into shipments at no undisclosed extra charge. Products subject to transport, licensing, safety, or location restrictions may be unavailable or require additional verification.</p>
      </PolicySection>

      <PolicySection title="6. Booking and arrival for services">
        <p>A requested appointment is not guaranteed until confirmed. Arrival windows and completion times are reasonable estimates. The professional may contact you for access or job details. You must disclose known hazards and ensure lawful, safe access to the work area.</p>
        <p>An inspection may be required before a final quotation. No work outside the confirmed scope, and no additional charge, should proceed without your approval. Parts and materials may be supplied by us, the professional, or you, as agreed in the booking or quotation.</p>
      </PolicySection>

      <PolicySection title="7. Rescheduling and cancellation of services">
        <p>You may request cancellation or rescheduling through support. Do so as early as possible. A cancellation, call-out, or inspection fee may apply only if it was disclosed before confirmation or you approve it later—for example, where a professional has travelled, attended, or procured non-returnable materials.</p>
        <p>If we or the professional must cancel, we will offer reasonable rescheduling or refund any amount collected for the unprovided portion. We may stop or refuse work where conditions are unsafe, unlawful, abusive, materially different from those disclosed, or beyond the professional&apos;s competence.</p>
      </PolicySection>

      <PolicySection title="8. Completion, customer approval, and warranty">
        <p>You should inspect completed work when reasonably possible and identify concerns promptly. Signing or confirming completion acknowledges apparent completion but does not waive hidden defects or mandatory consumer rights. Any workmanship or parts warranty will be stated in the booking, invoice, or product documentation; exclusions such as misuse, third-party alteration, normal wear, or customer-supplied defective parts apply only where disclosed and lawful.</p>
      </PolicySection>

      <PolicySection title="9. Complaints and support">
        <p>For delivery or service concerns, contact us with the order/booking number, date, description, and supporting photos or documents. We will review the matter and provide available tracking, corrective work, replacement, or refund options under the applicable policy and Pakistani law.</p>
        <PolicyContact />
      </PolicySection>
    </PolicyPage>
  );
}
