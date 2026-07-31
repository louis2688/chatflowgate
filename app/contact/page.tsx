import MarketingShell from "@/components/MarketingShell";

export const metadata = { title: "Contact - ChatFlowGate", alternates: { canonical: "/contact" } };

const row = "rounded-xl border border-white/10 bg-white/[0.03] p-5";
const a = "text-[#4a90e2] hover:underline";

export default function ContactPage() {
  return (
    <MarketingShell title="Contact" subtitle="We would love to hear from you.">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={row}>
          <p className="text-sm font-bold uppercase tracking-wide text-white">Support</p>
          <p className="mt-1 text-sm text-neutral-400">Trouble with a bot or the dashboard.</p>
          <a href="mailto:support@chatflowgate.com" className={`${a} mt-2 inline-block text-sm`}>support@chatflowgate.com</a>
        </div>
        <div className={row}>
          <p className="text-sm font-bold uppercase tracking-wide text-white">Sales</p>
          <p className="mt-1 text-sm text-neutral-400">Plans, volume, white-label.</p>
          <a href="mailto:hello@chatflowgate.com" className={`${a} mt-2 inline-block text-sm`}>hello@chatflowgate.com</a>
        </div>
        <div className={row}>
          <p className="text-sm font-bold uppercase tracking-wide text-white">Privacy</p>
          <p className="mt-1 text-sm text-neutral-400">Data access or deletion requests.</p>
          <a href="mailto:privacy@chatflowgate.com" className={`${a} mt-2 inline-block text-sm`}>privacy@chatflowgate.com</a>
        </div>
      </div>
+
    </MarketingShell>
  );
}