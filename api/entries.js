import { get, put, list, del } from '@vercel/blob';
import { guestbookHandler } from '../server/guestbook.js';

const prefix = 'guestbook/';
const path = id => prefix + id + '.json';

async function read(id) {
  const result = await get(path(id), { access: 'private', useCache: false });
  return result ? new Response(result.stream).json() : null;
}

export default guestbookHandler({
  ready: () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)),
  read,
  async list(limit) {
    let cursor;
    let files = [];
    do {
      const page = await list({ prefix, limit: 1000, cursor });
      files.push(...page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    // Four reads at a time keep function memory bounded with optional photos.
    const selected = files.slice(0, limit);
    const entries = [];
    for (let i = 0; i < selected.length; i += 4) {
      const batch = await Promise.all(selected.slice(i, i + 4).map(file =>
        read(file.pathname.slice(prefix.length, -5))));
      entries.push(...batch.filter(Boolean));
    }
    return entries;
  },
  async add(entry) {
    try {
      await put(path(entry.id), JSON.stringify(entry), {
        access: 'private', contentType: 'application/json',
        addRandomSuffix: false, allowOverwrite: false,
      });
    } catch (error) {
      if (!await read(entry.id)) throw error;
      // Same ID after a lost response is already saved. Never overwrite it.
    }
  },
  async remove(id) { await del(path(id)); },
});
