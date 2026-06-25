import { spawn } from "child_process";
import { Prompt } from "../../domain/model/Prompt";
import { LlmGateway } from "../../application/port/LlmGateway";

export interface CliOptions {
  /** Executable to run, e.g. "claude" or "gemini". */
  readonly command: string;
  /** Fixed args, e.g. ["-p"] for non-interactive print mode. */
  readonly args: string[];
  /** Flag used to pass the model, e.g. "--model" / "-m". Omitted if no model. */
  readonly modelFlag?: string;
  /** Model id; when empty the CLI's own default is used. */
  readonly model?: string;
  /** How the prompt reaches the CLI: as the last arg, or piped via stdin. */
  readonly promptVia: "arg" | "stdin";
}

/**
 * LlmGateway backed by a locally-installed CLI (Claude Code / Gemini CLI).
 * Uses the CLI's existing authentication — no API key required. Each call
 * spawns the process asynchronously and resolves with its stdout.
 */
export class CliLlmGateway implements LlmGateway {
  constructor(
    readonly name: string,
    private readonly opts: CliOptions,
  ) {}

  complete(prompt: Prompt): Promise<string> {
    const full = `${prompt.system}\n\n${prompt.user}`;
    const argv = [...this.opts.args];
    if (this.opts.modelFlag && this.opts.model) {
      argv.push(this.opts.modelFlag, this.opts.model);
    }
    if (this.opts.promptVia === "arg") {
      argv.push(full);
      return this.run(argv);
    }
    return this.run(argv, full);
  }

  private run(argv: string[], stdinText?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.opts.command, argv, { stdio: ["pipe", "pipe", "pipe"] });

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => (stdout += chunk));
      child.stderr.on("data", (chunk) => (stderr += chunk));

      child.on("error", (err: NodeJS.ErrnoException) => {
        reject(
          new Error(
            err.code === "ENOENT"
              ? `CLI not found: "${this.opts.command}" (is it installed and on PATH?)`
              : err.message,
          ),
        );
      });

      child.on("close", (code) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(`${this.opts.command} exited ${code}: ${(stderr || stdout).slice(0, 300)}`));
      });

      if (stdinText !== undefined) child.stdin.write(stdinText);
      child.stdin.end();
    });
  }
}
