import Image from "next/image";

type LogoProps = {
  className?: string;
  /** When true, show the wordmark "CITROËN" under the shield. */
  withWordmark?: boolean;
  /** Primary color (defaults to currentColor so it inherits from parent) */
  color?: string;
};

/**
 * Official-style Citroën 2022 monogram: vertically-stretched rounded shield
 * outline enclosing the two horizontal chevrons. Rendered as SVG so it scales
 * crisply and inherits currentColor for dark/light placement.
 */
export function CitroenLogo({
  className,
  withWordmark = false,
  color = "currentColor",
}: LogoProps) {
  const vb = withWordmark ? "0 0 64 84" : "0 0 64 72";
  return (
    <svg viewBox={vb} fill="none" className={className} aria-label="Citroën">
      {/* Shield outline */}
      <path
        d="M32 2
           C 50 2, 58 18, 58 36
           C 58 54, 50 70, 32 70
           C 14 70, 6 54, 6 36
           C 6 18, 14 2, 32 2 Z"
        stroke={color}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Upper chevron */}
      <path
        d="M14 28 L32 40 L50 28 L50 32 L32 44 L14 32 Z"
        fill={color}
      />
      {/* Lower chevron */}
      <path
        d="M16 40 L32 50 L48 40 L48 44 L32 54 L16 44 Z"
        fill={color}
      />
      {withWordmark && (
        <text
          x="32"
          y="81"
          textAnchor="middle"
          fontSize="11"
          fontWeight="500"
          fontFamily="'Space Grotesk', 'Inter', system-ui, sans-serif"
          letterSpacing="2"
          fill={color}
        >
          CITROËN
        </text>
      )}
    </svg>
  );
}

/** Tight-spaces variant — just the shield + chevrons, no wordmark. */
export function CitroenChevron({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 64 72" fill="none" className={className} aria-hidden>
      <path
        d="M32 2
           C 50 2, 58 18, 58 36
           C 58 54, 50 70, 32 70
           C 14 70, 6 54, 6 36
           C 6 18, 14 2, 32 2 Z"
        stroke={color}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M14 28 L32 40 L50 28 L50 32 L32 44 L14 32 Z" fill={color} />
      <path d="M16 40 L32 50 L48 40 L48 44 L32 54 L16 44 Z" fill={color} />
    </svg>
  );
}

/** PNG version — use when you need the exact official badge rendering. */
export function CitroenLogoImage({
  className,
  size = 40,
  priority = false,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/citroen-logo.png"
      alt="Citroën"
      width={size}
      height={Math.round(size * 1.1)}
      priority={priority}
      className={className}
    />
  );
}
