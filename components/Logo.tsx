import Image from "next/image";

// Intrinsic size of the supplied artwork. next/image needs the real ratio or
// it reserves the wrong space and the lockup renders squashed.
const W = 1221;
const H = 340;

/**
 * The wordmark is two-tone: "Gate" is brand blue, "Flow" and the shield are
 * neutral. The neutral half has to invert per surface -- charcoal on light,
 * white on dark -- so there are two files rather than one.
 *
 * Surfaces that follow the theme (the dashboard) render both and let CSS pick.
 * Pages that are always dark regardless of theme (landing, login, signup, docs)
 * pass `onDark`, because there the theme class must NOT decide -- a light-mode
 * visitor would otherwise get charcoal text on black.
 */
export default function Logo({
  className = "h-8 w-auto",
  onDark = false,
  priority = false,
}: {
  className?: string;
  onDark?: boolean;
  priority?: boolean;
}) {
  if (onDark) {
    return (
      <Image src="/logo-dark.png" alt="FlowGate" width={W} height={H} priority={priority} className={className} />
    );
  }
  return (
    <>
      <Image
        src="/logo.png"
        alt="FlowGate"
        width={W}
        height={H}
        priority={priority}
        className={`${className} block dark:hidden`}
      />
      {/* decorative twin: same mark, so it must not be announced twice */}
      <Image
        src="/logo-dark.png"
        alt=""
        aria-hidden
        width={W}
        height={H}
        priority={priority}
        className={`${className} hidden dark:block`}
      />
    </>
  );
}