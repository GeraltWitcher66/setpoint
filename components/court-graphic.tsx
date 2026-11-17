export function CourtGraphic() {
  return (
    <svg
      viewBox="0 0 520 400"
      role="img"
      aria-hidden="true"
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="court-surface" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1c8a58" />
          <stop offset="60%" stopColor="#116b43" />
          <stop offset="100%" stopColor="#08402a" />
        </linearGradient>
        <radialGradient id="court-glow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#d9ff3f" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#d9ff3f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ball-shade" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#f2ff9e" />
          <stop offset="60%" stopColor="#d9ff3f" />
          <stop offset="100%" stopColor="#a8cc1f" />
        </radialGradient>
        <filter id="ball-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#04140c" floodOpacity="0.45" />
        </filter>
      </defs>

      <rect x="0" y="0" width="520" height="400" rx="28" fill="url(#court-surface)" />
      <rect x="0" y="0" width="520" height="400" rx="28" fill="url(#court-glow)" />

      <g stroke="#ffffff" strokeOpacity="0.85" fill="none" strokeLinecap="square">
        <rect x="48" y="46" width="424" height="308" rx="4" strokeWidth="3" />
        <rect x="82" y="46" width="356" height="308" strokeWidth="2" strokeOpacity="0.7" />
        <line x1="82" y1="146" x2="438" y2="146" strokeWidth="2" strokeOpacity="0.7" />
        <line x1="82" y1="254" x2="438" y2="254" strokeWidth="2" strokeOpacity="0.7" />
        <line x1="260" y1="46" x2="260" y2="354" strokeWidth="2" strokeOpacity="0.7" />
        <line x1="260" y1="146" x2="260" y2="254" strokeWidth="3" />
      </g>

      <line
        x1="260"
        y1="30"
        x2="260"
        y2="370"
        stroke="#eaffb0"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeDasharray="6 7"
      />

      <circle cx="260" cy="200" r="34" fill="url(#ball-shade)" filter="url(#ball-shadow)" />
      <path
        d="M232 178c16 11 20 33 12 51M288 222c-16-11-20-33-12-51"
        stroke="#7f9c11"
        strokeOpacity="0.55"
        strokeWidth="2.5"
        fill="none"
      />

      <g fill="#d9ff3f" fillOpacity="0.9">
        <circle cx="48" cy="46" r="4" />
        <circle cx="472" cy="46" r="4" />
        <circle cx="48" cy="354" r="4" />
        <circle cx="472" cy="354" r="4" />
      </g>
    </svg>
  );
}
