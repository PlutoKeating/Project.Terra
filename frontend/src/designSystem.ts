/**
 * Terra Design System (Chromatic Heritage)
 * Inspired by 1980s personal computing nostalgia and contemporary minimalism.
 * Absolutely no hardcoded color values are allowed in individual page views.
 */

export const designSystem = {
  name: "Chromatic Heritage",
  colors: {
    // Core Backgrounds and Surfaces
    surface: "#fdf7ff",
    surfaceDim: "#ded8e0",
    surfaceBright: "#fdf7ff",
    surfaceContainerLowest: "#ffffff",
    surfaceContainerLow: "#f8f2fa",
    surfaceContainer: "#f2ecf4",
    surfaceContainerHigh: "#ece6ee",
    surfaceContainerHighest: "#e6e0e9",
    onSurface: "#1d1b20",
    onSurfaceVariant: "#494551",
    inverseSurface: "#322f35",
    inverseOnSurface: "#f5eff7",
    outline: "#7a7582",
    outlineVariant: "#cbc4d2",
    surfaceTint: "#6750a4",

    // Branding / Primary Actions
    primary: "#4f378a",
    onPrimary: "#ffffff",
    primaryContainer: "#6750a4",
    onPrimaryContainer: "#e0d2ff",
    inversePrimary: "#cfbcff",

    secondary: "#63597c",
    onSecondary: "#ffffff",
    secondaryContainer: "#e1d4fd",
    onSecondaryContainer: "#645a7d",

    tertiary: "#765b00",
    onTertiary: "#ffffff",
    tertiaryContainer: "#c9a74d",
    onTertiaryContainer: "#503d00",

    error: "#ba1a1a",
    onError: "#ffffff",
    errorContainer: "#ffdad6",
    onErrorContainer: "#93000a",

    background: "#fdf7ff",
    onBackground: "#1d1b20",
    surfaceVariant: "#e6e0e9",

    // Low contrast borders
    borderLight: "#e5e5e5",
    borderDark: "#1d1b20",
    gridDot: "#ded8e0",
  },

  // The 1980s computer rainbow band (Green, Yellow, Orange, Red, Purple, Blue)
  rainbow: [
    "#52b788", // Green (Top)
    "#f3c63f", // Yellow
    "#e67e22", // Orange
    "#e74c3c", // Red
    "#9b59b6", // Purple
    "#3498db", // Blue (Bottom)
  ],

  // Typography definitions (Courier Prime for narrative/structural, JetBrains Mono for metadata)
  typography: {
    headlineLg: "font-courier text-[32px] font-bold leading-[1.2] tracking-tight",
    headlineLgMobile: "font-courier text-[24px] font-bold leading-[1.2]",
    headlineMd: "font-courier text-[20px] font-bold leading-[1.4]",
    bodyLg: "font-courier text-[16px] font-normal leading-[1.6]",
    bodySm: "font-courier text-[14px] font-normal leading-[1.6]",
    labelCaps: "font-mono text-[12px] font-medium tracking-[0.1em] uppercase",
    code: "font-mono text-[13px] font-normal leading-[1.5]",
  },

  spacing: {
    base: "4px",
    xs: "8px",
    sm: "16px",
    md: "24px",
    lg: "40px",
    xl: "64px",
    containerMax: "1200px",
    gutter: "24px",
  },
};
