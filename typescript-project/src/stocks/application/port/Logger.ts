/** Driven port: progress/diagnostic output (keeps the use case free of console). */
export interface Logger {
  info(message: string): void;
  warn(message: string): void;
}
