export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export const GOOGLE_DRIVE_REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI;

export const FILENAME_REGEX = /^[^\\/:\*\?"<>|]+$/;
export const EMAIL_REGEX = /^[\w.%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}$/;
export const SUPER_ROLES = ["admin", "super_admin"];

export const IS_SAAS_MODE =
  String(process.env.APP_MODE || "selfhosted")
    .trim()
    .toLowerCase() === "saas";
export const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "";

export const t = {
  _ms: 1000,
  _min: 60,
  _hr: 3600,
  _day: 86400,
};

export const EXPORT_MAP = {
  "application/vnd.google-apps.document": "application/pdf",
  "application/vnd.google-apps.spreadsheet":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.google-apps.presentation":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export const DEFAULT_TRASH_RETENTION_DAYS = 5;

// These are validated at startup in app.js — the process exits with a clear
// message if any are missing from the environment.
export const requiredEnvVars = [
  // Runtime & server
  "NODE_ENV",
  "PORT",
  "APP_MODE",
  "COOKIE_SECRET",
  "MONGO_URI",
  "REDIS_URL",

  // CORS / CSRF
  "ALLOWED_ORIGINS",
  "MUTATING_METHODS",

  // Object storage (BYO S3-compatible) — file + public buckets
  "STORAGE_ACCESS_KEY",
  "STORAGE_SECRET_KEY",
  "STORAGE_BUCKET_NAME",
  "PUBLIC_ACCESS_KEY",
  "PUBLIC_SECRET_KEY",
  "PUBLIC_BUCKET_NAME",

  // Google OAuth (sign-in + Drive import)
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "GOOGLE_DRIVE_REDIRECT_URI",

  // Frontend URLs
  "CLIENT_AUTH_CALLBACK_URL",
  "CLIENT_URL",

  // Security
  "OAUTH_TOKEN_ENCRYPTION_KEY",

  // Email (RESEND_API_KEY or SMTP_* required depending on EMAIL_PROVIDER —
  // enforced conditionally in app.js via smtpEnvVars)
  "FROM_EMAIL",
  "APP_NAME",
];

// SMTP credentials required only when EMAIL_PROVIDER=smtp (checked in app.js).
// SMTP_PASS is optional — mailProvider.js falls back to SMTP_PASSWORD.
export const smtpEnvVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER"];

export const INSTANCE_CONFIG = {
  maxFileSize: 50 * 1000 * 1000 * 1000, // 50GB max single file upload
  chunkSize: 5e6, // 5MB S3 multipart chunks
  maxUploadConcurrency: 4, // Number of parallel chunks
};

export const THUMBNAIL_SIZE = 1e6; //1MB

export const fmtSize = (bytes) => {
  const gb = bytes / 1e9;
  if (gb >= 1000) return `${gb / 1000} TB`;
  if (gb >= 1) return `${gb} GB`;
  return `${Math.round(gb * 1000)} MB`;
};

export const MAX_USER_QUOTA = 2 * 1e9; // 2GB default storage quota (self-host)
export const MAX_USER_BANDWIDTH = 5 * 1e9; // 5GB default monthly bandwidth (self-host)
