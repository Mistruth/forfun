import fs from 'node:fs';
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import { config, dbPath } from './config.js';

fs.mkdirSync(config.dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  create table if not exists templates (
    id text primary key,
    name text not null,
    description text not null default '',
    category text not null default '我的模板',
    cover text not null default '📄',
    blocks text not null,
    created_at integer not null,
    updated_at integer not null
  );
`);

const rowToTemplate = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  cover: row.cover,
  blocks: JSON.parse(row.blocks),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listStmt = db.prepare('select * from templates order by updated_at desc');
const getStmt = db.prepare('select * from templates where id = ?');
const insertStmt = db.prepare(`
  insert into templates (id, name, description, category, cover, blocks, created_at, updated_at)
  values (@id, @name, @description, @category, @cover, @blocks, @createdAt, @updatedAt)
`);
const updateStmt = db.prepare(`
  update templates
  set name = @name,
      description = @description,
      category = @category,
      cover = @cover,
      blocks = @blocks,
      updated_at = @updatedAt
  where id = @id
`);
const deleteStmt = db.prepare('delete from templates where id = ?');

export const templateDb = {
  list() {
    return listStmt.all().map(rowToTemplate);
  },

  get(id) {
    const row = getStmt.get(id);
    return row ? rowToTemplate(row) : null;
  },

  save(template) {
    const now = Date.now();
    const id = template.id || `tpl_${nanoid(12)}`;
    const existing = getStmt.get(id);
    const record = {
      id,
      name: template.name,
      description: template.description || '',
      category: template.category || '我的模板',
      cover: template.cover || '📄',
      blocks: JSON.stringify(template.blocks),
      createdAt: existing?.created_at || now,
      updatedAt: now,
    };

    if (existing) {
      updateStmt.run(record);
    } else {
      insertStmt.run(record);
    }

    return this.get(id);
  },

  remove(id) {
    const result = deleteStmt.run(id);
    return result.changes > 0;
  },
};
