import MarketingShell from "@/components/MarketingShell";

export const metadata = { title: "About - ChatFlowGate" };

const h2 = "pt-3 text-lg font-bold uppercase tracking-wide text-white";

export default function AboutPage() {
  return (
    <MarketingShell title="About ChatFlowGate" subtitle="A secure interface and router for n8n Chat workflows.">
      <p>
        n8n lets you build powerful chat workflows. ChatFlowGate is the layer that sits between those workflows and the outside world, so you
        can put an assistant on any website without exposing your webhook, getting hammered by abuse, or building auth and analytics
        yourself. n8n is the brain; ChatFlowGate is the secure, branded interface in front of it.
      </p>

      <h2 className={h2}>What it does</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Keeps your n8n webhook server-side and hidden from the browser.</li>
        <li>Rate limits per session and per IP, with an IP ban list, tuned per bot.</li>
        <li>Restricts each widget to the domains you approve.</li>
        <li>Lets visitors chat anonymously, or captures a name, email and phone first.</li>
        <li>Ships a branded, streaming, markdown-rendering chat widget you embed with one script tag.</li>
        <li>Shows usage analytics from session metadata only.</li>
      </ul>

      <h2 className={h2}>What it is not</h2>
      <p>
        ChatFlowGate is not a conversation platform and not a competitor to a full help-desk inbox. We route and secure; we do not archive
        chats. The content of messages is never stored on our side.
      </p>
    </MarketingShell>
  );
}