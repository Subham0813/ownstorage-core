import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import PublicHeader from "../components/layout/PublicHeader";
import Toast from "../components/ui/Toast";
import Icon from "../components/ui/Icon";

const BRAND_FEATURES = [
  {
    icon: "shield",
    title: "Private by default",
    desc: "Encrypted files with granular, zero-knowledge access control.",
  },
  {
    icon: "zap",
    title: "Lightning fast",
    desc: "Resumable chunked uploads and instant in-app previews.",
  },
  {
    icon: "folder",
    title: "Organized workspaces",
    desc: "Folders, share links, and per-user permissions for every file.",
  },
  {
    icon: "globe",
    title: "Works everywhere",
    desc: "Sign in with email, Google, or GitHub across all your devices.",
  },
];

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 dark:bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

      <PublicHeader activePage="auth" />

      {/* Two-panel content — centered when it fits, scrolls cleanly when tall */}
      <main className="relative min-h-screen flex px-4 sm:px-6 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="w-full max-w-6xl m-auto grid lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-16 items-center">
          {/* Left marketing panel — hidden below lg */}
          <aside className="hidden lg:flex flex-col gap-7 max-w-md">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2.5 shrink-0">
                {/* BRAND CLOUD ICON — commented out, awaiting delete approval:
                <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white">
                    <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                  </svg>
                </span>
                */}
                <span className="font-display text-3xl font-extrabold tracking-tight whitespace-nowrap">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">Own</span>
                  <span className="text-slate-700 dark:text-zinc-300 font-normal">Storage</span>
                </span>
              </span>
            </div>

            <div>
              <h1 className="font-display text-[32px] lg:text-[34px] xl:text-[42px] font-extrabold leading-[1.18] tracking-tight text-slate-900 dark:text-zinc-100">
                Your files,{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                  your way
                </span>{" "}
                — everywhere.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-500 dark:text-zinc-400">
                Sign in to your workspace to upload, preview, share, and organize
                your files securely across every device you own.
              </p>
            </div>

            <ul className="space-y-5">
              {BRAND_FEATURES.map((f) => (
                <li key={f.title} className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Icon name={f.icon} size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                      {f.title}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                      {f.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-sm text-slate-400 dark:text-zinc-500 flex items-center gap-2">
              <Icon name="lock" size={15} className="text-blue-500 dark:text-blue-400" />
              Your data stays yours — end-to-end protected.
            </p>
          </aside>

          {/* Right form panel — centered below lg, flush right on lg+ */}
          <div className="w-full lg:max-w-[440px] flex flex-col items-center lg:items-start lg:justify-self-end">
            {children}
          </div>
        </div>
      </main>
      <Toast />
    </div>
  );
}
