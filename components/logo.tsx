import { siteConfig } from "@/config/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: siteConfig.theme.primary }}
      className={`relative inline-grid size-10 shrink-0 place-items-center rounded-2xl shadow-[0_8px_20px_-10px_rgba(11,63,42,0.9)] ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        style={{ color: siteConfig.theme.accent }}
      >
        <circle
          cx="12"
          cy="12"
          r="7.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M6.6 6.6c2.6 1.7 3.4 5.4 1.9 8.6-1 2.2-1 4-1 4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M17.4 17.4c-2.6-1.7-3.4-5.4-1.9-8.6 1-2.2 1-4 1-4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{ backgroundColor: siteConfig.theme.accent }}
        className="absolute -end-1 -top-1 size-2.5 rounded-full ring-2 ring-background"
      />
    </span>
  );
}
