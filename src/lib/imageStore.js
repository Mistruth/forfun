import { apiRequest } from './apiClient';

const IMAGE_REF_PREFIX = 'idb-image:';

export const toImageRef = (id) => `${IMAGE_REF_PREFIX}${id}`;

export const isImageRef = (value) => (
  typeof value === 'string' && value.startsWith(IMAGE_REF_PREFIX)
);

export const getImageIdFromRef = (ref) => (
  isImageRef(ref) ? ref.slice(IMAGE_REF_PREFIX.length) : null
);

export const saveImageFile = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const uploaded = await apiRequest('/api/images', {
    method: 'POST',
    body: formData,
  });
  return uploaded.url;
};

export const getImageObjectUrl = async (refOrId) => {
  if (isImageRef(refOrId)) return '';
  return refOrId || '';
};

export const resolveImageValue = async (value) => {
  if (isImageRef(value)) return '';
  return value || '';
};
