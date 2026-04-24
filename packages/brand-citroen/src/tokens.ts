export const citroenTokens = {
  brand: "citroen" as const,
  name: "Citroën",
  logoPath: "/brands/citroen/logo.svg",
  color: {
    primary: "#E30613",
    primaryDeep: "#981F21",
    primaryHover: "#C2050F",
    ink: "#1D1D1B",
    inkMuted: "#5A5A58",
    surface: "#FFFFFF",
    surfaceAlt: "#F5F5F5",
    surfaceDark: "#0E0E0E",
    border: "#E5E5E3",
    accent: "#FFD100",
    success: "#2E7D32",
    danger: "#C62828",
  },
  radius: {
    none: "0px",
    sm: "4px",
    md: "8px",
    lg: "16px",
    xl: "24px",
    full: "9999px",
  },
  font: {
    display: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
    body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    arabic: "'Noto Sans Arabic', 'Tajawal', sans-serif",
  },
  motion: {
    ease: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    easeSoft: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    durationFast: "180ms",
    durationBase: "320ms",
    durationSlow: "560ms",
  },
} as const;

export type CitroenTokens = typeof citroenTokens;
