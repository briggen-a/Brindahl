import { createHash, timingSafeEqual } from 'node:crypto';

export const validId = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);
export const passwordMatches = (given, expected) => {
  if (typeof given !== 'string' || given.length > 128 || !expected) return false;
  const digest = value => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
};

export function validateEntry(value) {
  if (!value || !validId(value.id) || typeof value.name !== 'string' ||
      !value.name.trim() || value.name.length > 64 ||
      typeof value.message !== 'string' || value.message.length > 400 ||
      typeof value.photo !== 'string' || value.photo.length > 109228) {
    throw Object.assign(new Error('Invalid entry.'), { status: 400 });
  }
  if (value.photo) {
    const photo = Buffer.from(value.photo, 'base64');
    if (photo.length > 81920 || photo.length < 5 ||
        photo.toString('base64') !== value.photo ||
        !photo.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ||
        !photo.subarray(-2).equals(Buffer.from([255, 217]))) {
      throw Object.assign(new Error('Invalid photo.'), { status: 400 });
    }
  }
  return { id: value.id, name: value.name.trim(), message: value.message.trim(),
    photo: value.photo, created: Date.now() };
}

// Storage is injected so the same HTTP handler can be tested without cloud credentials.
export function guestbookHandler(store, password = () => process.env.HOST_PASSWORD) {
  return async function handle(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const fail = (status, message) => res.status(status).json({ error: message });
    const url = new URL(req.url, 'http://localhost');
    const action = url.searchParams.get('action');
    if (!password() || !store.ready()) return fail(503, 'The shared guestbook is awaiting host setup.');
    try {
      if (action === 'host' || req.method === 'DELETE') {
        if (!passwordMatches(req.headers['x-host-key'], password())) {
          await new Promise(resolve => setTimeout(resolve, 350));
          return fail(403, 'Incorrect host password.');
        }
        if (action === 'host' && req.method === 'POST') return res.status(200).json({});
        if (req.method !== 'DELETE') return fail(405, 'Method not allowed.');
        const id = url.searchParams.get('id');
        if (!validId(id)) return fail(400, 'Invalid entry.');
        await store.remove(id);
        return res.status(200).json({});
      }
      if (req.method === 'GET') {
        const photoId = url.searchParams.get('photo');
        if (photoId !== null) {
          if (!validId(photoId)) return fail(400, 'Invalid entry.');
          const entry = await store.read(photoId);
          if (!entry?.photo) return fail(404, 'Photo not found.');
          res.setHeader('Content-Type', 'image/jpeg');
          return res.status(200).send(Buffer.from(entry.photo, 'base64'));
        }
        const limit = Number(url.searchParams.get('limit') || 12);
        if (!Number.isInteger(limit) || limit < 1 || limit > 200) return fail(400, 'Invalid limit.');
        const entries = await store.list(limit);
        return res.status(200).json(entries.map(entry => ({
          ...entry, photo: entry.photo ? '/api/entries?photo=' + entry.id : '',
        })));
      }
      if (req.method === 'POST') {
        if (!req.headers['content-type']?.startsWith('application/json')) return fail(400, 'JSON required.');
        if (Buffer.byteLength(JSON.stringify(req.body ?? null)) > 120000) return fail(413, 'Entry is too large.');
        const entry = validateEntry(req.body);
        await store.add(entry);
        return res.status(201).json({});
      }
      return fail(405, 'Method not allowed.');
    } catch (error) {
      return fail(error.status || 503, error.status ? error.message : 'Could not access the guestbook. Please retry.');
    }
  };
}
