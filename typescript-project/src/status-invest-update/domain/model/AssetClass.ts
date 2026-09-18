/**
 * The canonical asset classes a snapshot is broken into. Every provider maps
 * its own product taxonomy onto these, so a tab always means the same thing.
 */
export const ASSET_CLASSES = ["acoes-br", "fundos", "renda-fixa"] as const;

export type AssetClass = (typeof ASSET_CLASSES)[number];
