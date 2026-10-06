import { useNavigate, Link, useLocation } from "react-router-dom";
import { GITHUB_URL, BACKEND_URL, DOCS_URL } from "../../data/oss";

const productLinks = [
  { label: "Features", to: "/#features" },
  { label: "Get Started", to: "/#pricing" },
  { label: "FAQ", to: "/#faq" },
];

const legalLinks = [
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "User Agreement", to: "/agreement" },
];

const GitHubIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

export default function PublicFooter({ openSource = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Hash links (e.g. /#features) fail with plain <Link> on same-path clicks
  // (React Router no-ops identical hashes, so no hashchange fires). Mirror the
  // PublicHeader pattern: scroll directly when already on the target page.
  const handleAnchorClick = (to) => (e) => {
    const [path, hash] = to.split("#");
    if (path === location.pathname) {
      e.preventDefault();
      if (hash)
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 py-14 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          <div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5 mb-4"
            >
              <span className="inline-flex items-center gap-2.5 shrink-0">
                {/* BRAND CLOUD ICON — commented out, awaiting delete approval:
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-white">
                    <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                  </svg>
                </span>
                */}
                <span className="font-display text-lg font-extrabold tracking-tight whitespace-nowrap">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                    Own
                  </span>
                  <span className="text-slate-700 dark:text-zinc-300 font-normal">
                    Storage
                  </span>
                </span>
              </span>
            </button>
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              {openSource
                ? "An open-source, self-hostable cloud storage hub. Run it yourself for free, or start on our managed cloud in seconds."
                : "Open-source secure cloud storage for individuals and teams. Deploy anywhere or use our managed cloud."}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    onClick={handleAnchorClick(l.to)}
                    className="text-sm text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5">
              {openSource ? (
                <>
                  <li>
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      {GitHubIcon} GitHub Repo
                    </a>
                  </li>
                  <li>
                    <a
                      href={BACKEND_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Backend Repo
                    </a>
                  </li>
                  <li>
                    <a
                      href={DOCS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Docs &amp; README
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/register")}
                      className="text-sm text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Start Managed Cloud
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      {GitHubIcon} GitHub
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/signin")}
                      className="text-sm text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Sign In
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/register")}
                      className="text-sm text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Create Account
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-zinc-800">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              © {new Date().getFullYear()} OwnStorage Inc.{" "}
              <span className="hidden sm:inline text-slate-400 dark:text-zinc-500">
                · All rights reserved.
              </span>
            </p>

            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </span>

            {/* Legal + social */}
            {/* <div className="flex items-center gap-5 text-xs">
              {legalLinks.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  className="text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                >
                  {l.label.replace(" &", " &")}
                </Link>
              ))}
              <a
                href={openSource ? GITHUB_URL : "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {GitHubIcon}
              </a>
            </div> */}
            {/* <span className="text-center lg:text-left text-xs tracking-wide text-slate-400 dark:text-zinc-500">
              AES-256 encryption · SOC 2-ready infrastructure · Global
              S3-compatible storage · GDPR-ready
            </span> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
