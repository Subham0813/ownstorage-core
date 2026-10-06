export const STATS = [
  { value: "2 GB", label: "Free Storage Included" },
  { value: "99.99%", label: "Uptime SLA Guarantee" },
  { value: "AES-256", label: "Bank-Grade Encryption" },
  { value: "< 50ms", label: "Global CDN Latency" },
];

export const FEATURES = [
  {
    icon: "upload",
    title: "Upload & Organize",
    desc: "Drag & drop files and folders with real-time progress tracking. Create nested directories to keep everything structured exactly how you like it.",
  },
  {
    icon: "share",
    title: "Instant Sharing",
    desc: "Generate public links or scoped access tokens in one click. Share files with expiry dates and revoke access at any time.",
  },
  {
    icon: "eye",
    title: "In-Browser Preview",
    desc: "View images, videos, PDFs, and code files without downloading a thing. Your content, instantly accessible.",
  },
  {
    icon: "star",
    title: "Smart Favorites",
    desc: "Star important files and folders for instant retrieval. Your most-needed content is always one click away.",
  },
  {
    icon: "trash",
    title: "Safe Deletion",
    desc: "Deleted files sit safely in your bin. Restore anything within your plan's retention window — no panicked emails to support.",
  },
  {
    icon: "cloud",
    title: "Google Drive Import",
    desc: "Connect Google Drive and migrate your files directly into OwnStorage. No manual downloads, no wasted afternoon.",
  },
];

export const STEPS = [
  {
    num: "01",
    title: "Create Your Account",
    desc: "Sign up in 30 seconds with email, Google, or GitHub. OTP verification keeps your account secure from day one.",
  },
  {
    num: "02",
    title: "Upload & Organize",
    desc: "Drag & drop or click to upload. Build nested folders, track progress in real-time, and import from Google Drive.",
  },
  {
    num: "03",
    title: "Share & Access Anywhere",
    desc: "Generate shareable links with expiry controls, preview files in-browser, and access everything from any device.",
  },
];

export const CAPABILITIES = [
  "File Upload & Download",
  "In-browser preview (images, video, PDF, code)",
  "Public link sharing with expiry",
  "Per-file & folder access revocation",
  "Parallel uploads with progress tracking",
  "Nested folder structure",
  "Starred favorites",
  "Trash bin with plan-based retention",
  "Multi-device sync",
  "OTP-secured login",
  "OAuth: Google & GitHub",
  "Google Drive import",
];

export const SECURITY_CARDS = [
  {
    icon: "lock",
    title: "AES-256 Encryption",
    desc: "Every file is encrypted at rest and in transit with industry-standard AES-256 — the same standard used by banks.",
  },
  {
    icon: "shield",
    title: "OTP Verification",
    desc: "Logins and sensitive actions are verified via one-time password. No session reuse, no stale tokens.",
  },
  {
    icon: "server",
    title: "99.9% SLA & 0 Downtime",
    desc: "Files are stored on globally distributed servers. We guarantee 99.9% uptime and true 0 downtime architecture.",
  },
  {
    icon: "zap",
    title: "Signed CDN URLs",
    desc: "Download and preview URLs are short-lived and cryptographically signed — zero hotlinking or unauthorized access.",
  },
];

export const FAQS = [
  {
    q: "Is OwnStorage really free?",
    a: "Yes. The code is MIT-licensed and self-hosting is free forever. There are no plans, subscriptions, or credit cards — ever.",
  },
  {
    q: "How do storage limits work?",
    a: "You control everything on your own instance — per-user storage and bandwidth quotas, trash retention windows, and public-link caps are all configurable by the admin.",
  },
  {
    q: "What file types are supported?",
    a: "OwnStorage supports all file types. In-browser preview works for images, videos, PDFs, and text/code files. Everything else can be downloaded directly.",
  },
  {
    q: "How does file sharing work?",
    a: "Generate a public share link or share with specific users. Links can have expiry dates and can be revoked instantly from your dashboard.",
  },
  {
    q: "Where are my files stored?",
    a: "Wherever you point your S3-compatible bucket. OwnStorage runs entirely on your own infrastructure with your own keys and credentials.",
  },
  {
    q: "Is my data private by default?",
    a: "Completely. Every file is private until you explicitly share it. Access can be revoked instantly at the file or folder level.",
  },
];

export const SELF_HOSTED_POINTS = [
  {
    title: "Zero Platform Limits",
    desc: "No restrictions on bandwidth, files count, or maximum storage sizes.",
  },
  {
    title: "Docker Container Deploy",
    desc: "Up and running in seconds with single-command Docker Compose.",
  },
  {
    title: "Bring Your Own S3 Keys",
    desc: "Keep absolute control of your cloud storage credentials and bucket data.",
  },
];
