import MarketingShell from "@/components/MarketingShell";

export const metadata = { title: "Terms - Chatnode" };

const h2 = "pt-3 text-lg font-bold uppercase tracking-wide text-white";

export default function TermsPage() {
  return (
    <MarketingShell title="Terms of Service" subtitle="The basics of using Chatnode.">
      <p>By creating a workspace or using Chatnode, you agree to these terms.</p>

      <h2 className={h2}>The service</h2>
      <p>
        Chatnode is a secure gateway and widget for n8n Chat workflows. You bring your own n8n instance and webhooks; we proxy, secure, and
        meter the traffic to them.
      </p>

      <h2 className={h2}>Your responsibilities</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>You own your workflows, webhooks, branding and content, and are responsible for what your bots say and do.</li>
        <li>You are responsible for any personal data you collect through lead capture and for having a lawful basis to collect it.</li>
        <li>You will not use the service for anything unlawful, abusive, or to send malware or spam.</li>
      </ul>

      <h2 className={h2}>Billing</h2>
      <p>Usage is metered in message credits. Paid plans and their terms are shown at purchase.</p>

      <h2 className={h2}>Availability and warranty</h2>
      <p>
        The service is provided &quot;as is&quot;, without warranties of any kind. We do not guarantee uninterrupted availability, and features
        may change.
      </p>

      <h2 className={h2}>Limitation of liability</h2>
      <p>
        To the extent permitted by law, Chatnode is not liable for indirect or consequential damages, or for the acts of your workflows or
        the content they produce.
      </p>

      <h2 className={h2}>Changes and contact</h2>
      <p>
        We may update these terms; continued use means acceptance. Questions:{" "}
        <a href="mailto:hello@chatnode.app" className="text-[#4a90e2] hover:underline">hello@chatnode.app</a>.
      </p>

      <p className="text-sm text-neutral-500">This is a starting template, not legal advice. Have it reviewed by counsel before you rely on it.</p>
    </MarketingShell>
  );
}