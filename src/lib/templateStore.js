import { Low } from 'lowdb';

// ─── IndexedDB Adapter for lowdb ────────────────────────────
class IndexedDBAdapter {
  constructor(dbName, storeName) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  async _openDB() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(this.storeName);
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async read() {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get('data');
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async write(data) {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.put(data, 'data');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

const defaultData = { templates: [] };
const adapter = new IndexedDBAdapter('weixin-editor', 'templates');
const db = new Low(adapter, defaultData);

let ready = false;

const ensureReady = async () => {
  if (!ready) {
    await db.read();
    ready = true;
  }
};

const templateStore = {
  async init() {
    await ensureReady();
  },

  async getAll() {
    await ensureReady();
    return db.data.templates;
  },

  async getById(id) {
    await ensureReady();
    return db.data.templates.find((t) => t.id === id) || null;
  },

  async save(template) {
    await ensureReady();
    const idx = db.data.templates.findIndex((t) => t.id === template.id);
    if (idx !== -1) {
      db.data.templates[idx] = { ...template, updatedAt: Date.now() };
    } else {
      db.data.templates.push({
        ...template,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    await db.write();
    return template;
  },

  async remove(id) {
    await ensureReady();
    db.data.templates = db.data.templates.filter((t) => t.id !== id);
    await db.write();
  },

  async exportTemplate(id) {
    const tpl = await this.getById(id);
    if (!tpl) throw new Error('模板不存在');
    const exportData = {
      version: 1,
      name: tpl.name,
      description: tpl.description,
      cover: tpl.cover,
      blocks: tpl.blocks,
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${tpl.name}-template.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  },

  async importTemplate(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data || data.version !== 1 || !Array.isArray(data.blocks)) {
      throw new Error('模板文件格式不正确');
    }
    const tpl = {
      id: `tpl_user_${Date.now()}`,
      name: data.name || '导入模板',
      description: data.description || '',
      category: '我的模板',
      cover: data.cover || '📄',
      blocks: data.blocks,
    };
    await this.save(tpl);
    return tpl;
  },
};

export default templateStore;
