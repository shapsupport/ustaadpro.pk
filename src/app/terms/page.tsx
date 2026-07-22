import type { Metadata } from "next";
import { PolicyContact, PolicyList, PolicyPage, PolicySection } from "@/components/shared/PolicyPage";

export const metadata: Metadata = {
  title: "Terms and Conditions | Ustaad Pro",
  description: "Terms governing Ustaad Pro product orders and home-service bookings in Pakistan.",
};

export default function TermsPage() {
  return (
    <PolicyPage title="Terms and Conditions" description="These terms govern your use of ustaadpro.pk, product purchases, and bookings for home and professional services in Pakistan.">
      <PolicySection title="1. Acceptance and eligibility">
        <p>By accessing the website, creating an account, placing an order, or booking a service, you agree to these Terms and the policies linked below. If you do not agree, do not use the platform.</p>
        <p>You must be at least 18 years old and legally capable of entering into a contract, or use the platform under the supervision of a parent or legal guardian.</p>
      </PolicySection>

      <PolicySection title="2. About the platform">
        <p>Ustaad Pro provides an online platform for purchasing home-improvement products and requesting home or professional services. A service may be performed by Ustaad Pro personnel or an independent professional identified during the booking process. We will not describe a professional, product, price, warranty, or availability in a false or misleading way.</p>
      </PolicySection>

      <PolicySection title="3. Accounts and customer information">
        <p>You must provide accurate, current contact, delivery, and booking information and keep login credentials secure. You are responsible for activity conducted through your account unless you promptly report unauthorized use. Our handling of personal information is explained in the Privacy Policy.</p>
      </PolicySection>

      <PolicySection title="4. Orders, bookings, and contract formation">
        <PolicyList>
          <li>Website listings are invitations to place an order or booking request and may be corrected before acceptance.</li>
          <li>An order or booking is accepted when we send an acceptance/confirmation or begin fulfilment. An automated acknowledgement alone does not necessarily mean acceptance.</li>
          <li>We may refuse or cancel an order for an obvious pricing error, suspected fraud, unavailable stock or professional, unsafe conditions, an unsupported location, or incorrect information. Any amount already collected for a cancelled item or service will be refunded.</li>
          <li>Electronic communications and records may be used to form and evidence the transaction to the extent permitted by Pakistan law.</li>
        </PolicyList>
      </PolicySection>

      <PolicySection title="5. Prices and payment">
        <p>Prices are shown in Pakistani Rupees (PKR). Product price, delivery charge, inspection/visit charge, service charge, platform charge, applicable taxes, and any other mandatory fee will be disclosed before confirmation or, where work cannot reasonably be priced in advance, in an estimate requiring your approval.</p>
        <p>You authorize us and our payment providers to process the selected payment method. Cash on delivery may be limited by product, value, or location. You must not make an unauthorized chargeback or submit fraudulent payment information.</p>
      </PolicySection>

      <PolicySection title="6. Products">
        <p>We aim to present accurate descriptions, images, specifications, availability, and prices. Screen colours and manufacturer packaging may vary without changing the product materially. Title and risk pass as provided by applicable law and the agreed delivery terms. Manufacturer warranties, where offered, are subject to the manufacturer&apos;s terms and do not remove mandatory legal rights.</p>
      </PolicySection>

      <PolicySection title="7. Services and customer responsibilities">
        <PolicyList>
          <li>Provide safe, timely access to the premises, accurate job details, and access to necessary utilities.</li>
          <li>Keep children, pets, valuables, and hazardous materials away from the work area.</li>
          <li>Approve any revised scope or price before additional work begins. You may decline additional work.</li>
          <li>Do not request unlawful or unsafe work or directly misuse a professional&apos;s personal information.</li>
        </PolicyList>
        <p>Diagnosis may reveal work or parts not reasonably identifiable at booking. Estimates are not final where the scope changes with your approval. Completion times are estimates unless expressly guaranteed in writing.</p>
      </PolicySection>

      <PolicySection title="8. Cancellations, returns, refunds, and delays">
        <p>Product returns and refunds are governed by our Return &amp; Refund Policy. Delivery, failed delivery, service arrival, rescheduling, and service cancellation rules are governed by our Shipping &amp; Service Policy. Those policies form part of these Terms.</p>
      </PolicySection>

      <PolicySection title="9. Reviews and acceptable use">
        <p>Reviews must reflect genuine experiences. You must not post unlawful, threatening, discriminatory, defamatory, infringing, fraudulent, or malicious content; interfere with platform security; scrape the platform without permission; impersonate another person; or use the platform to commit an offence. We may moderate or remove content and restrict access for violations.</p>
      </PolicySection>

      <PolicySection title="10. Intellectual property">
        <p>The website, Ustaad Pro branding, design, software, text, and original content are owned by or licensed to Ustaad Pro and protected by applicable law. You receive a limited, revocable, non-transferable right to use the platform for personal, lawful transactions only.</p>
      </PolicySection>

      <PolicySection title="11. Liability and mandatory rights">
        <p>Nothing in these Terms excludes or limits liability or a consumer remedy that cannot lawfully be excluded, including rights relating to defective goods, deficient services, fraud, wilful misconduct, or personal injury where applicable.</p>
        <p>To the maximum extent permitted by law, Ustaad Pro is not liable for indirect, incidental, or consequential loss that was not reasonably foreseeable when the contract was made. Any permitted limitation will be applied fairly and in light of the nature of the transaction. Internet, utility, weather, security, supply-chain, and government disruptions outside reasonable control may delay performance, but we will take reasonable steps to notify affected customers and mitigate the delay.</p>
      </PolicySection>

      <PolicySection title="12. Complaints and dispute resolution">
        <p>Please contact us first with your order/booking number, the issue, and supporting evidence. We will acknowledge and review the complaint in good faith. If it is not resolved, the parties should attempt amicable resolution before proceedings. These Terms are governed by the laws of Pakistan. Courts and consumer authorities having lawful jurisdiction may hear a dispute; nothing here prevents a consumer from approaching a competent consumer authority or court.</p>
      </PolicySection>

      <PolicySection title="13. Changes and severability">
        <p>We may update these Terms prospectively for legal, operational, or service changes by publishing a new effective date. Terms applicable when an order or booking was accepted will continue to govern that transaction unless a mandatory law requires otherwise. If one provision is unenforceable, the remaining provisions continue to apply.</p>
      </PolicySection>

      <PolicySection title="14. Contact and legal address"><PolicyContact /></PolicySection>
    </PolicyPage>
  );
}
