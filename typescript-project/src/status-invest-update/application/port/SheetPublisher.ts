import { PublishedSheet, SheetDefinition } from "../../domain/model/SheetDefinition";

/** Output port: renders one sheet definition and says where it landed. */
export interface SheetPublisher {
  publish(definition: SheetDefinition): Promise<PublishedSheet>;
}
