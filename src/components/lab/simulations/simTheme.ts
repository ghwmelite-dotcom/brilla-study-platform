import type { CSSProperties } from 'react';

// The sim canvas lives inside the workspace's scrolling shell, where Chromium
// intermittently fails to paint class-based gradients built from Tailwind's
// var(--tw-gradient-*) custom properties — the background falls through to the
// white container and the sim's white text becomes unreadable, even though
// getComputedStyle still reports the dark gradient. A static inline gradient
// paints reliably; keep bg-slate-900 on the element as the solid fallback.
export function simRootBackground(via: string | null, direction = 'to bottom right'): CSSProperties {
  const stops = via === null ? '#1e293b, #0f172a' : `#0f172a, ${via}, #0f172a`;
  return { backgroundImage: `linear-gradient(${direction}, ${stops})` };
}
