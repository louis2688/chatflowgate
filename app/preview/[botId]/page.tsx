import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/server-auth";
import { getBot, orgHideBranding, publicConfig } from "@/lib/bots";
import PreviewStage from "@/components/PreviewStage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live preview - Chatnode" };

// Owner-only. The preview runs same-origin, which bypasses the bot's domain
// allowlist, so it must not be reachable by anyone holding a bot id -- and each
// message spends the workspace's allowance.
export default async function PreviewPage({ params }: { params: Promise<{ botId: string }> }) {
  const { orgId } = await requireContext();
  const { botId } = await params;
  const bot = await getBot(botId);
  if (!bot || bot.organizationId !== orgId) notFound();

  const hideBranding = await orgHideBranding(bot.organizationId);
  const css = bot.customCss ? bot.customCss.replace(/</g, "") : null;

  const facts: Array<[string, string]> = [
    ["Type", bot.widgetType === "inline" ? "Inline" : `Popup, ${bot.position.replace("-", " ")}`],
    ["Size", `${bot.widgetWidth} x ${bot.widgetHeight}`],
    ["Access", bot.allowAnonymous ? "Anonymous" : "Lead capture"],
    ["Geofencing", bot.geoMode === "off" ? "Off" : `${bot.geoMode} ${(bot.geoCountries ?? []).join(", ") || "(none listed)"}`],
    ["Rate limit", `${bot.ratePerSession}/session, ${bot.ratePerIp}/IP per min`],
  ];

  return (
    <>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <div className="min-h-dvh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold">{bot.name}</h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                A real conversation through the live gateway, using this bot&apos;s saved settings.
              </p>
            </div>
            <Link
              href={`/bots/${bot.id}`}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Back to editor
            </Link>
          </div>

          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
            Messages are real: they reach your n8n webhook and use your monthly message allowance. Testing here is kept out of
            your visitor analytics, and a lead form filled in on this page is not forwarded to your workflow.
          </div>

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-xs dark:border-neutral-800 dark:bg-neutral-900/40">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-neutral-500">{k}</dt>
                <dd className="mt-0.5 font-medium capitalize">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <PreviewStage
              config={publicConfig(bot)}
              hideBranding={hideBranding}
              widgetType={bot.widgetType}
              position={bot.position}
              width={bot.widgetWidth}
              height={bot.widgetHeight}
              buttonText={bot.buttonText}
              greeting={bot.greeting}
            />
          </div>
        </div>
      </div>
    </>
  );
}