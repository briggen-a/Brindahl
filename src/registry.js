const photoLimit = 80 * 1024;
export async function preparePhoto(file) {
  if (!file?.size) return '';
  if (file.size > 20 * 1024 * 1024) throw Error('Choose a photo smaller than 20 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 800 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    for (const quality of [.8,.65,.48,.32]) {
      const encoded = canvas.toDataURL('image/jpeg',quality).split(',')[1];
      if (encoded && encoded.length * .75 <= photoLimit) return encoded;
    }
    throw Error('size');
  } catch { throw Error('Try a smaller JPEG or PNG photo.'); }
  finally { URL.revokeObjectURL(url); }
}

async function request(path, options) {
  let response;
  try { response = await fetch('/api/entries' + path, {cache:'no-store',...options}); }
  catch { throw Error('Connection lost. Check your network and retry.'); }
  if (!response.ok) throw Error(({403:'Incorrect host password.',503:'The shared guestbook is awaiting host setup or is temporarily unavailable.',429:'Please wait a few seconds and try again.',507:'The guestbook drive is full.'})[response.status] || 'The registry could not complete that request. Please retry.');
  return response;
}

const onEsp = import.meta.env.VITE_REGISTRY_TARGET === 'esp';
export const registry = {
  async list(limit) {
    const response = await request('?limit=' + limit);
    if (!response.headers.get('Content-Type')?.includes('application/json')) {
      throw Error('The guestbook service is unavailable. Please try again later.');
    }
    return response.json();
  },
  sign(entry) {
    return request('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
  },
  unlock(key) {
    return request('?action=host', { method: 'POST', headers: { 'X-Host-Key': key } });
  },
  remove(id, key) {
    return request(onEsp ? '/' + id : '?id=' + id, { method: 'DELETE', headers: { 'X-Host-Key': key } });
  },
};
