import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  rootDir,
  distDir: path.join(rootDir, 'dist'),
  port: toPositiveInteger(process.env.PORT, 8080),
  dataDir: process.env.DATA_DIR || path.join(rootDir, 'data'),
  adminPassword: process.env.ADMIN_PASSWORD || 'wyd520',
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
  maxUploadMb: toPositiveInteger(process.env.MAX_UPLOAD_MB, 8),
  nodeEnv: process.env.NODE_ENV || 'development',
};

export const dbPath = path.join(config.dataDir, 'app.db');
export const uploadsDir = path.join(config.dataDir, 'uploads');
