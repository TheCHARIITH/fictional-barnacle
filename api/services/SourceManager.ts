import { SourceInterface } from '../sources/SourceInterface';

export class SourceManager {
  private sources: Map<string, SourceInterface> = new Map();

  registerSource(source: SourceInterface): void {
    this.sources.set(source.getName(), source);
  }

  getSource(name: string): SourceInterface | undefined {
    return this.sources.get(name);
  }

  getAllSources(): SourceInterface[] {
    return Array.from(this.sources.values());
  }

  getAvailableSources(): string[] {
    return Array.from(this.sources.keys()).filter(name => {
      const source = this.sources.get(name);
      return source?.isAvailable() !== false;
    });
  }
}
