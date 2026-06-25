/** Health classification applied to every analyzed field. */
export type FieldStatus = "good" | "caution" | "weak" | "na";

export const FIELD_STATUSES: readonly FieldStatus[] = ["good", "caution", "weak", "na"];

export function normalizeStatus(value: unknown): FieldStatus {
  const v = String(value ?? "").toLowerCase();
  return (FIELD_STATUSES as string[]).includes(v) ? (v as FieldStatus) : "na";
}
