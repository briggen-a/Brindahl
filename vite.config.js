import { defineConfig } from 'vite';
import guestbook from './api/entries.js';

export default defineConfig({
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] },
  plugins: [{
    name: 'guestbook-api',
    configureServer(server) {
      server.middlewares.use('/api/entries', async (req, res) => {
        req.url = '/api/entries' + req.url;
        res.status = code => { res.statusCode = code; return res; };
        res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
        res.send = data => res.end(data);
        try {
          const chunks = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 120000) {
              res.status(413).json({ error: 'Entry is too large.' });
              return;
            }
            chunks.push(chunk);
          }
          req.body = size ? JSON.parse(Buffer.concat(chunks).toString()) : undefined;
          await guestbook(req, res);
        } catch {
          res.status(400).json({ error: 'Invalid request.' });
        }
      });
    },
  }],
});
