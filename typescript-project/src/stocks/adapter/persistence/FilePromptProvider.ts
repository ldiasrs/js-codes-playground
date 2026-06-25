import * as fs from "fs";
import { PromptProvider } from "../../application/port/PromptProvider";

/** Loads the editable base prompt from stock-analysis-prompt.md. */
export class FilePromptProvider implements PromptProvider {
  constructor(private readonly filePath: string) {}

  async basePrompt(): Promise<string> {
    return fs.readFileSync(this.filePath, "utf8");
  }
}
