import fs from 'node:fs';
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import { config, dbPath } from './config.js';

fs.mkdirSync(config.dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  create table if not exists templates (
    id text primary key,
    name text not null,
    description text not null default '',
    category text not null default '我的模板',
    cover text not null default '📄',
    blocks text not null,
    version integer not null default 1,
    created_at integer not null,
    updated_at integer not null
  );

  create table if not exists template_versions (
    id text primary key,
    template_id text not null,
    version integer not null,
    name text not null,
    description text not null default '',
    category text not null default '我的模板',
    cover text not null default '📄',
    blocks text not null,
    note text not null default '',
    created_at integer not null,
    foreign key (template_id) references templates(id) on delete cascade
  );

  create index if not exists idx_template_versions_template_id
    on template_versions(template_id, version desc);
`);

const ensureColumn = (table, column, definition) => {
  const columns = db.prepare(`pragma table_info(${table})`).all();
  if (!columns.some((item) => item.name === column)) {
    db.exec(`alter table ${table} add column ${column} ${definition}`);
  }
};

ensureColumn('templates', 'version', 'integer not null default 1');

const rowToTemplate = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  cover: row.cover,
  blocks: JSON.parse(row.blocks),
  version: row.version || 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToTemplateVersion = (row) => ({
  id: row.id,
  templateId: row.template_id,
  version: row.version,
  name: row.name,
  description: row.description,
  category: row.category,
  cover: row.cover,
  blocks: JSON.parse(row.blocks),
  note: row.note,
  createdAt: row.created_at,
});

const listStmt = db.prepare('select * from templates order by updated_at desc');
const getStmt = db.prepare('select * from templates where id = ?');
const insertStmt = db.prepare(`
  insert into templates (id, name, description, category, cover, blocks, version, created_at, updated_at)
  values (@id, @name, @description, @category, @cover, @blocks, @version, @createdAt, @updatedAt)
`);
const updateStmt = db.prepare(`
  update templates
  set name = @name,
      description = @description,
      category = @category,
      cover = @cover,
      blocks = @blocks,
      version = @version,
      updated_at = @updatedAt
  where id = @id
`);
const deleteStmt = db.prepare('delete from templates where id = ?');
const listVersionsStmt = db.prepare(`
  select * from template_versions
  where template_id = @id
  order by version desc
  limit @limit offset @offset
`);
const countVersionsStmt = db.prepare('select count(*) as total from template_versions where template_id = ?');
const getVersionStmt = db.prepare('select * from template_versions where template_id = ? and version = ?');
const insertVersionStmt = db.prepare(`
  insert into template_versions (
    id, template_id, version, name, description, category, cover, blocks, note, created_at
  )
  values (
    @id, @templateId, @version, @name, @description, @category, @cover, @blocks, @note, @createdAt
  )
`);
const templatesWithoutVersionsStmt = db.prepare(`
  select * from templates t
  where not exists (
    select 1 from template_versions v where v.template_id = t.id
  )
`);

templatesWithoutVersionsStmt.all().forEach((row) => {
  insertVersionStmt.run({
    id: `tplv_${nanoid(12)}`,
    templateId: row.id,
    version: row.version || 1,
    name: row.name,
    description: row.description,
    category: row.category,
    cover: row.cover,
    blocks: row.blocks,
    note: '历史模板',
    createdAt: row.updated_at,
  });
});

const createVersion = (record, note = '') => {
  insertVersionStmt.run({
    id: `tplv_${nanoid(12)}`,
    templateId: record.id,
    version: record.version,
    name: record.name,
    description: record.description,
    category: record.category,
    cover: record.cover,
    blocks: record.blocks,
    note: String(note || '').trim().slice(0, 200),
    createdAt: record.updatedAt,
  });
};

const saveTemplateTransaction = db.transaction((template, note) => {
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
    version: existing ? (existing.version || 1) + 1 : 1,
    createdAt: existing?.created_at || now,
    updatedAt: now,
  };

  if (existing) {
    updateStmt.run(record);
  } else {
    insertStmt.run(record);
  }

  createVersion(record, note);
  return rowToTemplate(getStmt.get(id));
});

const restoreTemplateTransaction = db.transaction((id, versionNumber) => {
  const existing = getStmt.get(id);
  const version = getVersionStmt.get(id, versionNumber);
  if (!existing || !version) return null;

  const now = Date.now();
  const record = {
    id,
    name: version.name,
    description: version.description,
    category: version.category,
    cover: version.cover,
    blocks: version.blocks,
    version: (existing.version || 1) + 1,
    createdAt: existing.created_at,
    updatedAt: now,
  };

  updateStmt.run(record);
  createVersion(record, `恢复到 v${versionNumber}`);
  return rowToTemplate(getStmt.get(id));
});

export const templateDb = {
  list() {
    return listStmt.all().map(rowToTemplate);
  },

  get(id) {
    const row = getStmt.get(id);
    return row ? rowToTemplate(row) : null;
  },

  save(template, options = {}) {
    return saveTemplateTransaction(template, options.note);
  },

  versions(id, options = {}) {
    const page = Math.max(1, Number.parseInt(options.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(options.pageSize, 10) || 10));
    const total = countVersionsStmt.get(id)?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const items = listVersionsStmt.all({
      id,
      limit: pageSize,
      offset: (safePage - 1) * pageSize,
    }).map(rowToTemplateVersion);

    return {
      items,
      page: safePage,
      pageSize,
      total,
      totalPages,
    };
  },

  restore(id, versionNumber) {
    return restoreTemplateTransaction(id, versionNumber);
  },

  remove(id) {
    const result = deleteStmt.run(id);
    return result.changes > 0;
  },
};
