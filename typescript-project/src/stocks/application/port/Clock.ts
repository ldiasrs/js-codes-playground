/** Driven port: time source (injected so the use case stays deterministic/testable). */
export interface Clock {
  now(): Date;
}
