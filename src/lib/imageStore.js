const DB_NAME = 'weixin-editor-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const IMAGE_REF_PREFIX = 'idb-image:';

let dbPromise = null;
const objectUrlCache = new Map();

const openDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
};

const runStoreRequest = async (mode, createRequest) => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = createRequest(store);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
};

export const toImageRef = (id) => `${IMAGE_REF_PREFIX}${id}`;

export const isImageRef = (value) => (
  typeof value === 'string' && value.startsWith(IMAGE_REF_PREFIX)
);

export const getImageIdFromRef = (ref) => (
  isImageRef(ref) ? ref.slice(IMAGE_REF_PREFIX.length) : null
);

export const saveImageFile = async (file) => {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const record = {
    id,
    blob: file,
    name: file.name,
    type: file.type,
    size: file.size,
    createdAt: Date.now(),
  };

  await runStoreRequest('readwrite', (store) => store.put(record));
  return toImageRef(id);
};

export const getImageObjectUrl = async (refOrId) => {
  const id = getImageIdFromRef(refOrId) || refOrId;
  if (!id) return '';
  if (objectUrlCache.has(id)) return objectUrlCache.get(id);

  const record = await runStoreRequest('readonly', (store) => store.get(id));
  if (!record?.blob) return '';

  const url = URL.createObjectURL(record.blob);
  objectUrlCache.set(id, url);
  return url;
};

export const resolveImageValue = async (value) => {
  if (!isImageRef(value)) return value || '';
  return getImageObjectUrl(value);
};
