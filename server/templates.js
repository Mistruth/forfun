import express from 'express';
import { templateDb } from './db.js';

const router = express.Router();

const assertStringLength = (value, label, max) => {
  const text = String(value || '').trim();
  if (!text) {
    const error = new Error(`${label}不能为空`);
    error.status = 400;
    throw error;
  }
  if (text.length > max) {
    const error = new Error(`${label}不能超过 ${max} 个字符`);
    error.status = 400;
    throw error;
  }
  return text;
};

const normalizeTemplatePayload = (body, existing = {}) => {
  const name = assertStringLength(body.name ?? existing.name, '模板名称', 50);
  const description = String(body.description ?? existing.description ?? '').trim();
  if (description.length > 200) {
    const error = new Error('模板描述不能超过 200 个字符');
    error.status = 400;
    throw error;
  }

  const blocks = body.blocks ?? existing.blocks;
  if (!Array.isArray(blocks)) {
    const error = new Error('blocks 必须是数组');
    error.status = 400;
    throw error;
  }

  return {
    id: body.id || existing.id,
    name,
    description,
    category: String(body.category || existing.category || '我的模板'),
    cover: String(body.cover || existing.cover || '📄'),
    blocks,
  };
};

const normalizeVersionNote = (value) => {
  const note = String(value || '').trim();
  if (note.length > 200) {
    const error = new Error('版本备注不能超过 200 个字符');
    error.status = 400;
    throw error;
  }
  return note;
};

router.get('/', (req, res) => {
  res.json({ data: templateDb.list() });
});

router.post('/', (req, res, next) => {
  try {
    const payload = normalizeTemplatePayload(req.body || {});
    const saved = templateDb.save(payload, {
      note: normalizeVersionNote(req.body?.versionNote || '创建模板'),
    });
    res.status(201).json({ data: saved });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res) => {
  const template = templateDb.get(req.params.id);
  if (!template) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }
  res.json({ data: template });
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = templateDb.get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: '模板不存在' });
      return;
    }
    const payload = normalizeTemplatePayload({ ...req.body, id: req.params.id }, existing);
    const saved = templateDb.save(payload, {
      note: normalizeVersionNote(req.body?.versionNote || '更新模板'),
    });
    res.json({ data: saved });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/versions', (req, res) => {
  const template = templateDb.get(req.params.id);
  if (!template) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }
  res.json({
    data: templateDb.versions(req.params.id, {
      page: req.query.page,
      pageSize: req.query.pageSize,
    }),
  });
});

router.post('/:id/restore/:version', (req, res) => {
  const versionNumber = Number.parseInt(req.params.version, 10);
  if (!Number.isFinite(versionNumber) || versionNumber < 1) {
    res.status(400).json({ error: '版本号不正确' });
    return;
  }

  const saved = templateDb.restore(req.params.id, versionNumber);
  if (!saved) {
    res.status(404).json({ error: '模板或版本不存在' });
    return;
  }
  res.json({ data: saved });
});

router.delete('/:id', (req, res) => {
  const removed = templateDb.remove(req.params.id);
  if (!removed) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }
  res.json({ data: { id: req.params.id } });
});

export default router;
