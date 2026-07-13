import { CdbPosition } from "../../domain/model/CdbPosition";

export interface CdbSource {
  load(): CdbPosition[];
}
