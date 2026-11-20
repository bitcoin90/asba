export default function Logo({
  name = "ASBA AI",
  size = "md",
  light = false,
}: {
  name?: string;
  size?: "sm" | "md" | "lg";
  light?: boolean;
}) {
  const dim = size === "lg" ? 44 : size === "sm" ? 28 : 36;
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={dim} height={dim} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id="lg-asba" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--brand)" />
            <stop offset="1" stopColor="var(--brand-2)" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#lg-asba)" />
        <g fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 46 L32 16 L44 46" />
          <path d="M25.5 36 H38.5" />
        </g>
        <circle cx="32" cy="16" r="4" fill="#fff" />
        <circle cx="20" cy="46" r="4" fill="#fff" />
        <circle cx="44" cy="46" r="4" fill="#fff" />
        <circle cx="48" cy="12" r="2.5" fill="#fff" opacity=".8" />
        <circle cx="55" cy="20" r="1.8" fill="#fff" opacity=".6" />
      </svg>
      <span
        className={`font-extrabold tracking-tight ${
          size === "lg" ? "text-2xl" : size === "sm" ? "text-lg" : "text-xl"
        } ${light ? "text-white" : "text-zinc-900 dark:text-white"}`}
      >
        {name}
      </span>
    </span>
  );
}
