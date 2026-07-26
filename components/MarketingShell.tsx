import Link from "next/link";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

export default function MarketingShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      <div className="m-stripe" />
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#1c69d4]/20 blur-[130px]" />

      <nav className="relative mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Link href="/"><Logo onDark className="h-10 w-auto" /></Link>
        <Link href="/login" className="text-xs font-bold uppercase tracking-[1.5px] text-neutral-300 transition-colors hover:text-white">Log in</Link>
      </nav>

      <div className="relative mx-auto max-w-3xl px-6 py-10 lg:py-14">
        <h1 className="text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-3 text-neutral-400">{subtitle}</p> : null}
        <div className="m-stripe mt-6 w-32" />
        <div className="mt-8 space-y-5 text-[15px] font-light leading-relaxed text-neutral-300">{children}</div>
      </div>

      <SiteFooter />
    </main>
  );
}