import Link from "next/link";

const LINKS: Array<[string, string]> = [
  ["/terms", "Terms"],
  ["/privacy", "Privacy"],
  ["/about", "About"],
  ["/contact", "Contact"],
];

export default function SiteFooter() {
  return (
    <>
      <div className="relative m-stripe" />
      <footer className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-6 text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-500">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className="transition-colors hover:text-white">
            {label}
          </Link>
        ))}
        <span className="text-neutral-700">&copy; {new Date().getFullYear()} ChatFlowGate</span>
      </footer>
    </>
  );
}