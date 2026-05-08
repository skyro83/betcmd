type IconProps = { stroke?: string };

export const Ic = {
  home: ({ stroke = "currentColor" }: IconProps) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  ball: ({ stroke = "currentColor" }: IconProps) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3l3 5-1 5 5 1M12 3L9 8l1 5-5 1M9 8l-4 1M15 8l4 1M14 13l-2 5M10 13l2 5" />
    </svg>
  ),
  trophy: ({ stroke = "currentColor" }: IconProps) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h8v6a4 4 0 11-8 0V4z" />
      <path d="M16 6h3v2a3 3 0 01-3 3M8 6H5v2a3 3 0 003 3" />
      <path d="M10 16h4v3h-4zM8 19h8" />
    </svg>
  ),
  user: ({ stroke = "currentColor" }: IconProps) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  ),
  bell: ({ stroke = "currentColor" }: IconProps) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
      <path d="M10 20a2 2 0 004 0" />
    </svg>
  ),
  back: ({ stroke = "currentColor" }: IconProps) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  chev: ({ stroke = "currentColor" }: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  print: ({ stroke = "currentColor" }: IconProps) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V3h12v6" />
      <rect x="4" y="9" width="16" height="9" rx="2" />
      <rect x="7" y="14" width="10" height="6" rx="1" />
      <circle cx="17" cy="12" r="0.6" fill={stroke} />
    </svg>
  ),
};
