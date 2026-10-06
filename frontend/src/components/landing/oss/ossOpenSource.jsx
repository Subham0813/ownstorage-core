import { Section } from "../Section";
import { Icon } from "../../ui/Icon";
import {
  GITHUB_URL,
  BACKEND_URL,
  DOCS_URL,
  QUICKSTART_COMMANDS,
  OSS_NOTE,
} from "../../../data/oss";

const REPOS = [
  {
    url: GITHUB_URL,
    title: "Storage-App-Frontend",
    desc: "React + Vite + Tailwind dashboard and landing UI. The main repo — this is where you star, fork, and open issues.",
    icon: "grid",
  },
  {
    url: BACKEND_URL,
    title: "Storage-App-Backend",
    desc: "Node.js + Express + MongoDB API, S3-compatible object storage, OAuth, and subscription engine.",
    icon: "server",
  },
];

const STACK = [
  "React",
  "Vite",
  "Tailwind CSS",
  "Node.js",
  "Express",
  "MongoDB",
  "S3",
];

export function OSSOpenSource() {
  return (
    <Section
      id="open-source"
      className="py-12 sm:py-14 lg:py-16 scroll-mt-24 bg-slate-100/70 dark:bg-zinc-900/40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Fully Open Source
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight mb-4">
              Get the <span className="gradient-text">Code</span>
            </h2>

            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed mb-8">
              OwnStorage ships as two open-source repositories — a React
              frontend and a Node.js/Express backend. Clone them, read the
              README, and run it locally with plain npm in under a minute.
            </p>

            <div className="space-y-4 mb-8">
              {REPOS.map((repo) => (
                <a
                  key={repo.title}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 hover:border-blue-500/40 hover:-translate-y-0.5 transition-[border-color,transform] duration-300"
                >
                  <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Icon name={repo.icon} size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900 dark:text-zinc-100 truncate">
                        {repo.title}
                      </span>
                      <Icon
                        name="arrowUpRight"
                        size={14}
                        className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0"
                      />
                    </span>
                    <span className="block text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mt-0.5">
                      {repo.desc}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {STACK.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-full text-xs font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80"
                >
                  {s}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 active:scale-95 transition-[background-color,transform,box-shadow]"
              >
                <Icon name="github" size={15} />
                Star the Repo
              </a>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:border-blue-400/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Icon name="book" size={15} />
                Read the Docs
              </a>
            </div>
          </div>

          {/* Quickstart terminal */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/20 bg-[#0b0f19]">
            <div className="flex items-center justify-between px-5 py-3 bg-[#111827] border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/90" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/90" />
              </div>
              <span className="text-xs font-mono text-slate-400 select-none">
                terminal
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold">
                <span className="w-1 h-1 rounded-full bg-blue-400" />
                run locally
              </span>
            </div>

            <div className="p-5 font-mono text-xs sm:text-sm text-left text-slate-300 leading-relaxed overflow-x-auto">
              {QUICKSTART_COMMANDS.map((c, i) => (
                <div key={i} className="whitespace-pre">
                  <span className="text-emerald-400">$ </span>
                  {c}
                </div>
              ))}
              <div className="mt-4 text-slate-500"># Open in your browser:</div>
              <div className="text-slate-100 bg-slate-900 p-3 rounded-lg border border-slate-800 mt-2 select-all">
                <span>
                  {import.meta.env.DEV
                    ? "http://your-dev-server:3000"
                    : "http://localhost:5173"}
                </span>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-[#111827]">
              <p className="text-xs text-slate-400">{OSS_NOTE}</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
