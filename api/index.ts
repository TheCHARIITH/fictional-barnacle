import { VercelRequest, VercelResponse } from '@vercel/node';
import { SubtitleService } from './services/SubtitleService';
import { SourceManager } from './services/SourceManager';
import { BaiscopeLK } from './sources/BaiscopeLK';
import { CineruLK } from './sources/CineruLK';
import { PirateLK } from './sources/PirateLK';
import { ZoomLK } from './sources/ZoomLK';

// Initialize services
const sourceManager = new SourceManager();
sourceManager.registerSource(new BaiscopeLK());
sourceManager.registerSource(new CineruLK());
sourceManager.registerSource(new PirateLK());
sourceManager.registerSource(new ZoomLK());

const subtitleService = new SubtitleService(sourceManager);

export default async (req: VercelRequest, res: VercelResponse) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { pathname, query } = req.url ? new URL(req.url, `http://${req.headers.host}`).pathname.split('?') : { pathname: '/', query: {} };

  try {
    // Parse query string
    const queryParams = new URLSearchParams(req.url?.split('?')[1] || '');

    if (pathname.includes('/search')) {
      const searchQuery = queryParams.get('query');
      const sources = queryParams.get('sources')?.split(',') || [];

      if (!searchQuery) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const results = await subtitleService.search(searchQuery, sources);
      return res.status(200).json({
        query: searchQuery,
        results,
        count: results.length,
        author: 'TheCHARITH (Charith Pramodya Senananayake)',
        api: 'Sinhala Subtitle Search API'
      });
    }

    if (pathname.includes('/download')) {
      const url = queryParams.get('url');
      const source = queryParams.get('source');

      if (!url || !source) {
        return res.status(400).json({ error: 'URL and source parameters are required' });
      }

      const content = await subtitleService.download(url, source);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="subtitle.zip"');
      return res.end(content);
    }

    if (pathname.includes('/sources')) {
      const sources = sourceManager.getAvailableSources();
      return res.status(200).json({
        sources,
        total: sources.length,
        author: 'TheCHARITH (Charith Pramodya Senananayake)',
        api: 'Sinhala Subtitle Search API'
      });
    }

    // Return API info
    return res.status(200).json({
      author: 'TheCHARITH (Charith Pramodya Senananayake)',
      api: 'Sinhala Subtitle Search API',
      version: '1.0.0',
      endpoints: [
        '/api/search?query=oppenheimer&sources=baiscope',
        '/api/download?url=https://www.baiscope.lk/...&source=baiscope',
        '/api/sources'
      ],
      sites: ['baiscope', 'cineru', 'piratelk', 'zoom']
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};
