import { ReactNode } from 'react';
import Layout from '@/components/layout/Layout';

function DocShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Layout showMobileNav={false}>
      <article className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h1>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">{children}</div>
      </article>
    </Layout>
  );
}

export function PricingGuidePage() {
  return (
    <DocShell title="Pricing Guide">
      <p>
        On GaonBazaar, farmers set their own listing prices. Buyers may negotiate through chat when the listing
        allows it. Platform fees or payment charges, if any, are shown at checkout before you confirm an order.
      </p>
      <p>
        Prices can change when listings are updated or stock runs out. Always review the final amount on the
        order summary before paying.
      </p>
    </DocShell>
  );
}

export function QualityStandardsPage() {
  return (
    <DocShell title="Quality Standards">
      <p>
        We encourage accurate descriptions, clear photos, and honest grading of produce. Farmers should ship items
        that match what was agreed in the order.
      </p>
      <p>
        If something arrives in poor condition or does not match the listing, use Support in the app so the team
        can review and help resolve the issue according to our processes.
      </p>
    </DocShell>
  );
}

export function TermsPage() {
  return (
    <DocShell title="Terms & Conditions">
      <p>
        By using GaonBazaar you agree to use the service lawfully, provide accurate account information, and honour
        commitments you make to other users (for example, confirmed orders and agreed delivery terms).
      </p>
      <p>
        The platform connects buyers and farmers; individual sale terms are between those parties unless stated
        otherwise in the product or order flow. We may update these terms from time to time; continued use after
        changes means you accept the updated terms.
      </p>
      <p className="text-xs text-muted-foreground/90">
        This is a summary for convenience and does not replace formal legal terms where required by law. Contact us
        if you need the full legal document.
      </p>
    </DocShell>
  );
}

export function PrivacyPolicyPage() {
  return (
    <DocShell title="Privacy Policy">
      <p>
        We collect information you provide (such as name, contact details, and addresses needed for delivery) and
        data required to run the service (such as order history and device logs for security).
      </p>
      <p>
        We use this data to operate accounts, process orders, send important notifications, and improve the product.
        We do not sell your personal information. We may share data with payment providers and infrastructure
        partners only as needed to provide the service.
      </p>
      <p>
        You can request corrections or ask questions about your data through the contact details in the footer.
      </p>
      <p className="text-xs text-muted-foreground/90">
        This is a high-level description. A detailed policy may be provided separately where required.
      </p>
    </DocShell>
  );
}
