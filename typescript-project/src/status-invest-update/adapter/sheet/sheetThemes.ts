export interface Rgb {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

export interface SheetTheme {
  /** Tab colour and header background. */
  readonly header: Rgb;
  /** A light tint of the same hue, for zebra banding. */
  readonly band: Rgb;
}

export const WHITE: Rgb = { red: 1, green: 1, blue: 1 };

const THEMES: Record<string, SheetTheme> = {
  "acoes-br": {
    header: { red: 0.16, green: 0.38, blue: 0.71 },
    band: { red: 0.89, green: 0.93, blue: 0.98 },
  },
  fundos: {
    header: { red: 0.46, green: 0.28, blue: 0.64 },
    band: { red: 0.93, green: 0.9, blue: 0.97 },
  },
  "renda-fixa": {
    header: { red: 0.06, green: 0.52, blue: 0.53 },
    band: { red: 0.87, green: 0.95, blue: 0.95 },
  },
  resumo: {
    header: { red: 0.2, green: 0.2, blue: 0.22 },
    band: { red: 0.93, green: 0.93, blue: 0.94 },
  },
};

const FALLBACK: SheetTheme = {
  header: { red: 0.35, green: 0.35, blue: 0.35 },
  band: { red: 0.93, green: 0.93, blue: 0.93 },
};

/** Themes are keyed by asset class; a tab title carries it as its prefix. */
export function themeFor(sheetTitle: string): SheetTheme {
  const match = Object.keys(THEMES).find((name) => sheetTitle.startsWith(name));
  return match ? THEMES[match] : FALLBACK;
}
