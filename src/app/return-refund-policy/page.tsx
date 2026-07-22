import type { Metadata } from "next";
import { PolicyContact, PolicyList, PolicyPage, PolicySection } from "@/components/shared/PolicyPage";

export const metadata: Metadata = {
  title: "Return and Refund Policy | Ustaad Pro",
  description: "Rules and timelines for product returns, service complaints, and refunds from Ustaad Pro.",
};

export default function ReturnRefundPolicyPage() {
  return (
    <PolicyPage title="Return and Refund Policy" description="This policy explains when products may be returned, who pays courier charges, and when approved refunds are issued.">
      <PolicySection title="1. Seven-day product return window">
        <p>You may request a return within <strong className="text-gray-900">7 calendar days after delivery</strong>. Contact us before sending an item and provide the order number, reason for return, photos or video where relevant, and your contact details. A request made after the window may be declined unless applicable law or an express warranty requires otherwise.</p>
      </PolicySection>

      <PolicySection title="2. Return eligibility">
        <p>For a change-of-mind return, the product must be unused, uninstalled, unaltered, complete, and in resalable condition with original packaging, labels, manuals, accessories, warranty cards, and proof of purchase.</p>
        <p>Unless faulty, incorrectly supplied, or otherwise required by law, the following cannot be returned: custom-made or cut-to-size goods; opened hygiene or safety-sensitive goods; perishable or consumable items; activated software/digital goods; clearance items marked final sale; and goods damaged through misuse, improper installation, normal wear, or unauthorized repair.</p>
      </PolicySection>

      <PolicySection title="3. Courier charges">
        <p><strong className="text-gray-900">The customer pays the return courier fee.</strong> You may pay the courier directly or, if we arrange collection, the actual disclosed return courier cost may be deducted from the refund.</p>
        <p>Where the return is due to a wrong item, a product damaged before delivery, a verified manufacturing defect, counterfeit goods, or another failure for which Ustaad Pro is legally responsible, we will reimburse reasonable return shipping or arrange collection where required by applicable law. Original delivery charges are not refundable for a change-of-mind return.</p>
      </PolicySection>

      <PolicySection title="4. Safe return process">
        <PolicyList>
          <li>Obtain return authorization and the correct return address from support.</li>
          <li>Pack the item securely. Do not send it cash-on-delivery unless we agree in writing.</li>
          <li>Use a traceable courier and retain the receipt and tracking number until the case closes.</li>
          <li>Risk of loss during a customer-arranged return remains with the customer until we receive it.</li>
        </PolicyList>
        <p>The office address below is our contact address; returns must only be sent there if support confirms it as the return destination.</p>
      </PolicySection>

      <PolicySection title="5. Inspection and refund timing">
        <p>We will inspect a returned product after receipt and notify you whether the return is approved or rejected, with a reason. For an eligible return, we will <strong className="text-gray-900">initiate the refund within 7 business days after receiving and inspecting the product</strong>. Your bank, wallet, or card provider may take additional time to credit the funds.</p>
        <p>Refunds are normally made to the original payment method. For cash-on-delivery, we may request a verified Pakistani bank account or supported mobile-wallet details. Any lawful deduction, including an agreed return courier cost or loss in value caused by handling beyond inspection, will be itemized.</p>
      </PolicySection>

      <PolicySection title="6. Damaged, defective, or incorrect products">
        <p>Inspect the parcel promptly and report visible transit damage, missing parts, or an incorrect item as soon as reasonably possible, preferably within 48 hours, with photos or an unboxing video if available. Not reporting within 48 hours does not remove a right that cannot legally be limited.</p>
        <p>Depending on the facts and applicable law, we may offer repair, replacement, price adjustment, or refund. Do not install or continue using an item that appears unsafe.</p>
      </PolicySection>

      <PolicySection title="7. Service concerns and refunds">
        <p>Services cannot be physically returned. If a service was not provided, materially differs from the approved scope, or was deficient, notify us promptly with the booking number and evidence. We may inspect the work and, as appropriate, arrange re-performance, corrective work, a partial refund, or a full refund. Completed and properly delivered labour, consumed materials, inspection charges, and approved third-party costs are generally non-refundable.</p>
        <p>Once a service refund is approved, we will initiate it within 7 business days. Provider processing time may be additional.</p>
      </PolicySection>

      <PolicySection title="8. Non-waivable consumer rights">
        <p>This policy adds to, and does not exclude, any remedy that cannot be waived under the Islamabad Consumers Protection Act, 1995, other applicable Pakistani consumer-protection law, or the Sale of Goods Act, 1930. Where mandatory law gives you a stronger right, that law prevails.</p>
      </PolicySection>

      <PolicySection title="9. Start a return or refund request"><PolicyContact /></PolicySection>
    </PolicyPage>
  );
}
