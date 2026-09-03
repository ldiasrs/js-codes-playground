export type SnapshotArtifact =
  | { fileName: string; kind: "json"; body: unknown }
  | { fileName: string; kind: "bytes"; body: Buffer };

export interface SnapshotSource {
  readonly name: string;
  fetch(): Promise<SnapshotArtifact>;
}
