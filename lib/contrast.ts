// WCAG 2.1 relative-luminance contrast -- the algorithm documented at
// colorjs.io/docs/contrast as "WCAG21". Kept dependency-free (the colorjs.io
// package is blocked by the supply-chain firewall) and DB-free so the selfcheck
// can exercise it.

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const chans = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * chans[0] + 0.7152 * chans[1] + 0.0722 * chans[2];
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Black or white text, whichever is more legible on `bg`. So a light brand
// colour never gets unreadable white text on it.
export function readableText(bg: string): string {
  if (!/^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(bg)) return "#ffffff";
  return contrast(bg, "#ffffff") >= contrast(bg, "#111111") ? "#ffffff" : "#111111";
}