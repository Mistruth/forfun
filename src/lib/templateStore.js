import { apiRequest } from './apiClient';

const downloadJson = (filename, data) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};

const templateStore = {
  async init() {
    return undefined;
  },

  async getAll() {
    return apiRequest('/api/templates');
  },

  async getById(id) {
    return apiRequest(`/api/templates/${encodeURIComponent(id)}`);
  },

  async save(template) {
    const hasServerId = template.id && !String(template.id).startsWith('tpl_user_');
    const method = hasServerId ? 'PUT' : 'POST';
    const url = hasServerId
      ? `/api/templates/${encodeURIComponent(template.id)}`
      : '/api/templates';

    return apiRequest(url, {
      method,
      body: JSON.stringify(template),
    });
  },

  async remove(id) {
    return apiRequest(`/api/templates/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async exportTemplate(id) {
    const tpl = await this.getById(id);
    if (!tpl) throw new Error('模板不存在');
    downloadJson(`${tpl.name}-template.json`, {
      version: 1,
      name: tpl.name,
      description: tpl.description,
      cover: tpl.cover,
      blocks: tpl.blocks,
    });
  },

  async importTemplate(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data || data.version !== 1 || !Array.isArray(data.blocks)) {
      throw new Error('模板文件格式不正确');
    }

    return this.save({
      name: data.name || '导入模板',
      description: data.description || '',
      category: '我的模板',
      cover: data.cover || '📄',
      blocks: data.blocks,
    });
  },
};

export default templateStore;
