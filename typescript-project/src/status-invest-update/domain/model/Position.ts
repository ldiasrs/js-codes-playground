import { CellValue } from "./Column";

/** One holding, as canonical cells keyed by column id. */
export type Position = Readonly<Record<string, CellValue>>;
