import MarketingShell from "@/components/MarketingShell";

export const metadata = { title: "Contact - Chatnode" };

const row = "rounded-xl border border-white/10 bg-white/[0.03] p-5";
const a = "text-[#4a90e2] hover:underline";

export default function ContactPage() {
  return (
    <MarketingShell title="Contact" subtitle="We would love to hear from you.">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={row}>
          <p className="text-sm font-bold uppercase tracking-wide text-white">Support</p>
          <p className="mt-1 text-sm text-neutral-400">Trouble with a bot or the dashboard.</p>
          <a href="mailto:support@chatnode.app" className={`${a} mt-2 inline-block text-sm`}>support@chatnode.app</a>
        </div>
        <div className={row}>
          <p className="text-sm font-bold uppercase tracking-wide text-white">Sales</p>
          <p className="mt-1 text-sm text-neutral-400">Plans, volume, white-label.</p>
          <a href="mailto:hello@chatnode.app" className={`${a} mt-2 inline-block text-sm`}>hello@chatnode.app</a>
        </div>
        <div className={row}>
          <p className="text-sm font-bold uppercase tracking-wide text-white">Privacy</p>
          <p className="mt-1 text-sm text-neutral-400">Data access or deletion requests.</p>
          <a href="mailto:privacy@chatnode.app" className={`${a} mt-2 inline-block text-sm`}>privacy@chatnode.app</a>
        </div>
      </div>
+
    </MarketingShell>
  );
}