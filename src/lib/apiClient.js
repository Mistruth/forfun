export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: options.body instanceof FormData
      ? options.headers
      : {
          'content-type': 'application/json',
          ...(options.headers || {}),
        },
  });

  const contentType = response.headers.get('content-type') || '';
  const isJsonResponse = contentType.includes('application/json');
  const payload = isJsonResponse
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new ApiError(payload?.error || '请求失败', response.status);
  }

  if (!isJsonResponse) {
    throw new ApiError('服务器返回了无法识别的响应', response.status);
  }

  return payload?.data;
};
