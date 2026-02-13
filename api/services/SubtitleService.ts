import { SourceManager } from './SourceManager';
import { SourceInterface } from '../sources/SourceInterface';

export class SubtitleService {
  constructor(private sourceManager: SourceManager) {}

  async search(query: string, sources: string[] = []): Promise<any[]> {
    if (!query) {
      throw new Error('Query is required');
    }

    const results: any[] = [];
    const sourcesToSearch = this.getSourcesForSearch(sources);

    // Search in parallel
    const searchPromises = sourcesToSearch.map(async (source) => {
      try {
        const sourceResults = await source.search(query);
        return sourceResults;
      } catch (error) {
        console.error(`Search error for ${source.getName()}:`, error);
        return [];
      }
    });

    const allResults = await Promise.all(searchPromises);
    
    for (const sourceResults of allResults) {
      results.push(...sourceResults);
    }

    // Sort by source
    results.sort((a, b) => a.source.localeCompare(b.source));

    return results;
  }

  async download(url: string, sourceName: string): Promise<Buffer> {
    const source = this.sourceManager.getSource(sourceName);

    if (!source) {
      throw new Error(`Invalid source: ${sourceName}`);
    }

    const download = await source.download(url);
    return download.content;
  }

  getAvailableSources(): string[] {
    return this.sourceManager.getAvailableSources();
  }

  private getSourcesForSearch(requestedSources: string[]): SourceInterface[] {
    if (requestedSources.length === 0) {
      return this.sourceManager.getAllSources();
    }

    const sources = requestedSources
      .map(name => this.sourceManager.getSource(name))
      .filter((source): source is SourceInterface => source !== undefined);

    if (sources.length === 0) {
      throw new Error('None of the requested sources are available');
    }

    return sources;
  }
}
