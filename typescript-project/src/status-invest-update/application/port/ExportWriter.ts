import { ExportDefinition } from "../../domain/model/ExportDefinition";

/** Output port: renders one export definition somewhere and returns its URL/location. */
export interface ExportWriter {
  write(definition: ExportDefinition): Promise<string>;
}
