/**
 * A fixed-income position from the Status Invest CDB export.
 * Field spellings (`expiredate`, `initalValue`) match the source file.
 */
export interface CdbPosition {
  readonly referenceDate: string;
  readonly brokerId: number;
  readonly brokerName: string;
  readonly emissorId: number;
  readonly emissorName: string;
  readonly investimentType: string;
  readonly firstDate: string;
  readonly expiredate: string;
  readonly displayName: string;
  readonly rateType: string;
  readonly indexerType: string;
  readonly rate: number;
  readonly currentValue: number;
  readonly initalValue: number;
  readonly ganhoBruto: number;
  readonly withdrawalValue: number;
}
