import Image from "next/image";

const W = 852;
const H = 693;

/**
 * The wordmark is two-tone: "Chat" is brand blue, "Layer" is dark charcoal. The
 * charcoal half vanishes on a dark background, so there is a second file with
 * that half recoloured light.
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
      <Image src="/logo-dark.png" alt="Chatnode" width={W} height={H} priority={priority} className={className} />
    );
  }
  return (
    <>
      <Image
        src="/logo.png"
        alt="Chatnode"
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