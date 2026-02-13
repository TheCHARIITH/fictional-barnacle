import { SourceInterface } from './SourceInterface';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class BaiscopeLK implements SourceInterface {
  private baseURL = 'https://baiscopelk.com';
  private timeout = 10000;

  getName(): string {
    return 'baiscope';
  }

  async search(query: string): Promise<any[]> {
    try {
      const searchURL = `${this.baseURL}/?s=${encodeURIComponent(query)}`;
      const response = await axios.get(searchURL, { timeout: this.timeout });
      return this.parseSearchResults(response.data, query);
    } catch (error) {
      throw new Error(`Search failed for ${this.getName()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async download(url: string): Promise<{ content: Buffer; filename: string; size: number }> {
    try {
      const downloadURL = await this.getDownloadURL(url);
      const response = await axios.get(downloadURL, {
        timeout: this.timeout,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      return {
        content: Buffer.from(response.data),
        filename: 'subtitle.zip',
        size: response.data.length
      };
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isAvailable(): boolean {
    return true; // Assume available for now
  }

  private async getDownloadURL(postURL: string): Promise<string> {
    const response = await axios.get(postURL, { timeout: this.timeout });
    const $ = cheerio.load(response.data);
    
    const downloadLink = $('a[data-e-disable-page-transition=true]').attr('href');
    
    if (!downloadLink) {
      throw new Error('Download link not found on page');
    }

    return downloadLink;
  }

  private parseSearchResults(html: string, query: string): any[] {
    const $ = cheerio.load(html);
    const results: any[] = [];

    $('a').each((index, element) => {
      const title = $(element).text().trim();
      const url = $(element).attr('href');

      if (title && url && title.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          title,
          url,
          source: this.getName()
        });
      }
    });

    return results.slice(0, 20);
  }
}