// The USB build uses the shared ESP API. Hosted design previews are device-local.
export const preview = import.meta.env.VITE_REGISTRY_TARGET !== 'esp';
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
  catch { throw Error('Connection lost. Rejoin the Brindahl Wi-Fi and retry.'); }
  if (!response.ok) throw Error(({403:'Incorrect host key.',429:'Please wait a few seconds and try again.',507:'The guestbook drive is full.'})[response.status] || 'The registry could not complete that request. Please retry.');
  return response;
}

function localStore(mode, operation) {
  return new Promise((resolve,reject) => {
    const open = indexedDB.open('brindahl-preview-guestbook',1);
    open.onupgradeneeded = () => open.result.createObjectStore('entries',{keyPath:'id'});
    open.onerror = () => reject(Error('Browser storage is unavailable.'));
    open.onsuccess = () => {
      const db = open.result, tx = db.transaction('entries',mode);
      const req = operation(tx.objectStore('entries'));
      tx.oncomplete = () => { db.close(); resolve(req.result); };
      tx.onabort = () => { db.close(); reject(Error('Browser storage could not save this change.')); };
    };
  });
}
export const registry = preview ? {
  async list(limit) { return (await localStore('readonly',s=>s.getAll())).sort((a,b)=>b.created-a.created).slice(0,limit); },
  sign(entry) { return localStore('readwrite',s=>s.put({...entry,photo:entry.photo ? 'data:image/jpeg;base64,' + entry.photo : ''})); },
  remove(id) { return localStore('readwrite',s=>s.delete(id)); },
} : {
  async list(limit) { return (await request('?limit='+limit)).json(); },
  sign(entry) { return request('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)}); },
  remove(id,key) { return request('/'+id,{method:'DELETE',headers:{'X-Host-Key':key}}); },
};
