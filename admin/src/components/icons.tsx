// Jeu d'icônes SVG (style trait, 24x24, currentColor) — aucune emoji dans l'app.
import type { CSSProperties } from 'react';

interface IconProps { size?: number; className?: string; style?: CSSProperties }

function svg(size = 18, extra?: CSSProperties): React.SVGProps<SVGSVGElement> {
  return {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round',
    strokeLinejoin: 'round', style: extra,
  };
}

export const IconInbox = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

export const IconMusic = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

export const IconList = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <path d="M21 15V6" />
    <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path d="M12 12H3" />
    <path d="M16 6H3" />
    <path d="M12 18H3" />
  </svg>
);

export const IconBriefcase = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <rect width="20" height="14" x="2" y="7" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export const IconCamera = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export const IconRoute = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <circle cx="6" cy="19" r="3" />
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
    <circle cx="18" cy="5" r="3" />
  </svg>
);

export const IconImage = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

export const IconUpload = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

export const IconExternalLink = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

export const IconSun = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" /><path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" /><path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

export const IconMoon = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export const IconAudioLines = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" />
    <path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v3" />
  </svg>
);

export const IconChevronUp = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}><path d="m18 15-6-6-6 6" /></svg>
);

export const IconChevronDown = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}><path d="m6 9 6 6 6-6" /></svg>
);

export const IconX = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

export const IconTrash = (p: IconProps) => (
  <svg {...svg(p.size)} className={p.className}>
    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// Play "plein" (overlay vidéo).
export const IconPlay = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="currentColor" className={p.className} style={p.style}>
    <path d="M8 5v14l11-7z" />
  </svg>
);
