export interface SourceInterface {
  getName(): string;
  search(query: string): Promise<any[]>;
  download(url: string): Promise<{ content: Buffer; filename: string; size: number }>;
  isAvailable(): boolean;
}
