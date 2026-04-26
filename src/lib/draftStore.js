const DRAFT_KEY = 'editor_draft';

export const loadDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const { blocks, savedAt } = JSON.parse(raw);
    if (Array.isArray(blocks)) return { blocks, savedAt };
  } catch {
    // Ignore broken drafts and start with an empty editor.
  }

  return null;
};

export const saveDraft = (blocks) => {
  const data = { blocks, savedAt: Date.now() };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  return data.savedAt;
};
