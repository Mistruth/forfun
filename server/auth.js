import crypto from 'node:crypto';
import cookie from 'cookie';
import { config } from './config.js';

const COOKIE_NAME = 'wechat_editor_session';
const SESSION_VALUE = 'authenticated';

const sign = (value) => {
  return crypto
    .createHmac('sha256', config.sessionSecret)
    .update(value)
    .digest('base64url');
};

const createCookieValue = () => {
  return `${SESSION_VALUE}.${sign(SESSION_VALUE)}`;
};

const isValidCookieValue = (value) => {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (payload !== SESSION_VALUE || !signature) return false;
  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
};

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

export const isAuthenticated = (req) => {
  const parsed = cookie.parse(req.headers.cookie || '');
  return isValidCookieValue(parsed[COOKIE_NAME]);
};

export const requireAuth = (req, res, next) => {
  if (isAuthenticated(req)) {
    next();
    return;
  }
  res.status(401).json({ error: '未登录' });
};

export const getSession = (req, res) => {
  res.json({ data: { authenticated: isAuthenticated(req) } });
};

export const createSession = (req, res) => {
  const password = String(req.body?.password || '');
  if (!password || password !== config.adminPassword) {
    res.status(401).json({ error: '口令不正确' });
    return;
  }

  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, createCookieValue(), {
    ...cookieOptions,
    secure: config.nodeEnv === 'production',
  }));
  res.json({ data: { authenticated: true } });
};

export const destroySession = (req, res) => {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, '', {
    ...cookieOptions,
    maxAge: 0,
    secure: config.nodeEnv === 'production',
  }));
  res.json({ data: { authenticated: false } });
};
