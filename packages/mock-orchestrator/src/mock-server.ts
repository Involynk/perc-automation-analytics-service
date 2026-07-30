import * as http from 'http';
import * as url from 'url';
import { record, getSentMessages, clear } from './recorder';

export function startMockServer(port: number): Promise<http.Server> {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url || '', true);
      const path = parsed.pathname || '';
      const method = req.method || 'GET';

      let body = '';
      req.on('data', (chunk: string) => (body += chunk));
      req.on('end', () => {
        let payload: any = {};
        try {
          payload = JSON.parse(body);
        } catch {}

        const headers = { 'Content-Type': 'application/json' };

        // GET /recorded — return all recorded messages (for test assertions)
        if (method === 'GET' && path === '/recorded') {
          res.writeHead(200, headers);
          res.end(JSON.stringify({ messages: getSentMessages() }));
          return;
        }

        // POST /clear — clear recorded messages
        if (method === 'POST' && path === '/clear') {
          clear();
          res.writeHead(200, headers);
          res.end(JSON.stringify({ status: 'cleared' }));
          return;
        }

        // WhatsApp send message
        if (method === 'POST' && path.includes('/messages') && payload.messaging_product === 'whatsapp') {
          record('whatsapp', payload.to, payload.text?.body || '(template)');
          res.writeHead(200, headers);
          res.end(JSON.stringify({ messages: [{ id: `mock_wa_${Date.now()}` }] }));
          return;
        }

        // Instagram send message
        if (method === 'POST' && path.endsWith('/me/messages') && payload.recipient?.id) {
          record('instagram', payload.recipient.id, payload.message?.text || '');
          res.writeHead(200, headers);
          res.end(JSON.stringify({ message_id: `mock_ig_${Date.now()}` }));
          return;
        }

        // Facebook send message
        if (method === 'POST' && path.endsWith('/me/messages') && payload.recipient?.id) {
          record('facebook', payload.recipient.id, payload.message?.text || '');
          res.writeHead(200, headers);
          res.end(JSON.stringify({ message_id: `mock_fb_${Date.now()}` }));
          return;
        }

        // Fallback: record any POST with to/text fields
        if (method === 'POST' && payload.to) {
          record('unknown', payload.to, payload.text || '');
          res.writeHead(200, headers);
          res.end(JSON.stringify({ success: true, mock: true }));
          return;
        }

        res.writeHead(404, headers);
        res.end(JSON.stringify({ error: 'not_found', path, method }));
      });
    });

    server.listen(port, () => {
      console.log(`[MOCK SERVER] Listening on port ${port}`);
      resolve(server);
    });
  });
}
