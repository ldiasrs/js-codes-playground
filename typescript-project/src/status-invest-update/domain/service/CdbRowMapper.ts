import moment from "moment";
import { CdbPosition } from "../model/CdbPosition";
import { ExportRow } from "../model/ExportDefinition";

export const CDB_HEADERS = [
  "referenceDate",
  "brokerId",
  "brokerName",
  "emissorId",
  "emissorName",
  "investimentType",
  "firstDate",
  "expiredate",
  "displayName",
  "rateType",
  "indexerType",
  "rate",
  "currentValue",
  "initalValue",
  "ganhoBruto",
  "withdrawalValue",
] as const;

export class CdbRowMapper {
  readonly headers = CDB_HEADERS;

  toRow(position: CdbPosition): ExportRow {
    return {
      referenceDate: moment(position.referenceDate).format("DD/MM/YYYY"),
      brokerId: position.brokerId,
      brokerName: position.brokerName,
      emissorId: position.emissorId,
      emissorName: position.emissorName,
      investimentType: position.investimentType,
      firstDate: moment(position.firstDate).format("DD/MM/YYYY"),
      expiredate: moment(position.expiredate).format("DD/MM/YYYY"),
      displayName: position.displayName,
      rateType: position.rateType,
      indexerType: position.indexerType,
      rate: position.rate,
      currentValue: position.currentValue,
      initalValue: position.initalValue,
      ganhoBruto: position.ganhoBruto,
      withdrawalValue: position.withdrawalValue,
    };
  }
}
