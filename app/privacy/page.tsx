import MarketingShell from "@/components/MarketingShell";

export const metadata = { title: "Privacy - ChatLayer" };

const h2 = "pt-3 text-lg font-bold uppercase tracking-wide text-white";

export default function PrivacyPage() {
  return (
    <MarketingShell title="Privacy" subtitle="What ChatLayer collects, and what it deliberately does not.">
      <p>
        ChatLayer is a gateway in front of your n8n workflows. This page describes the data the service handles. If you run a bot, you are
        responsible for what your workflow does with any data it receives.
      </p>

      <h2 className={h2}>The one thing we do not store</h2>
      <p>
        <strong className="text-neutral-100">Chat message content is never written to our database.</strong> Messages pass through the
        gateway to your workflow and back; we keep counts, not text.
      </p>

      <h2 className={h2}>Dashboard accounts</h2>
      <p>When you sign up we store your name, email, and either a hashed password or your Google profile basics. Used to run your account.</p>

      <h2 className={h2}>Visitor sessions</h2>
      <p>
        For each chat session we store metadata: IP address, approximate location (country, region, city), browser, OS and device, an
        anonymous session id, and a message count. This powers the analytics and the security controls (rate limiting and IP bans).
      </p>

      <h2 className={h2}>Lead capture</h2>
      <p>
        If a bot is set to lead capture, the name, email and phone a visitor submits are stored on that session and forwarded to the bot
        owner&apos;s n8n workflow. Only enable it when you have a lawful basis to collect those details.
      </p>

      <h2 className={h2}>How data is used and shared</h2>
      <p>
        To run and secure the service, show usage analytics, and forward leads to your own n8n webhook. We do not sell data. It is processed
        by our hosting and database providers, and sent only to the webhook you configure.
      </p>

      <h2 className={h2}>Retention and your rights</h2>
      <p>
        Session data is kept while your workspace is active; deleting a bot removes its sessions. To request access to or deletion of your
        data, email <a href="mailto:privacy@chatlayer.io" className="text-[#4a90e2] hover:underline">privacy@chatlayer.io</a>.
      </p>

      <p className="text-sm text-neutral-500">This is a plain-language summary, not legal advice. Have it reviewed before you rely on it.</p>
    </MarketingShell>
  );
}