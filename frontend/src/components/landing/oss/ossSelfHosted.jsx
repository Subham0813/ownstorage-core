import { Section } from "../Section";
import { Icon } from "../../ui/Icon";
import { SELF_HOSTED_POINTS } from "../../../data/landingContent";
import { GITHUB_URL } from "../../../data/oss";

export function OSSSelfHosted() {
  return (
    <Section id="self-hosted" className="py-12 sm:py-14 lg:py-16 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Self-Hosted &amp; Free
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight mb-4">
              Deploy on Your{" "}
              <span className="gradient-text">Own Infrastructure</span>
            </h2>

            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed mb-8">
              OwnStorage is 100% open-source. Connect your own S3-compatible
              bucket — AWS, Cloudflare R2, MinIO, or Backblaze B2 — and keep
              absolute control of your files. No accounts, no limits, no
              subscription.
            </p>

            <div className="space-y-4 mb-8">
              {SELF_HOSTED_POINTS.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="check" size={13} />
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      {item.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-zinc-400">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-slate-900 dark:text-zinc-100 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              View GitHub Source
            </a>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/20 bg-[#0b0f19]">
            <div className="flex items-center justify-between px-5 py-3 bg-[#111827] border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/90" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/90" />
              </div>
              <span className="text-xs font-mono text-slate-400 select-none">
                docker-compose.yml
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                publishing soon
              </span>
            </div>

            <div className="p-5 font-mono text-xs sm:text-sm text-left text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
              <div>
                <span className="text-blue-400">version:</span>{" "}
                <span className="text-emerald-400">"3.8"</span>
              </div>
              <div>
                <span className="text-blue-400">services:</span>
              </div>
              <div className="pl-4">
                <span className="text-blue-400">ownstorage:</span>
              </div>
              <div className="pl-8">
                <span className="text-blue-400">image:</span> ownstorage/app:latest
              </div>
              <div className="pl-8">
                <span className="text-blue-400">ports:</span>
              </div>
              <div className="pl-12">
                - <span className="text-emerald-400">"3000:3000"</span>
              </div>
              <div className="pl-8">
                <span className="text-blue-400">environment:</span>
              </div>
              <div className="pl-12">- AWS_ACCESS_KEY_ID=$S3_KEY</div>
              <div className="pl-12">- AWS_SECRET_ACCESS_KEY=$S3_SECRET</div>
              <div className="pl-12">- S3_BUCKET_NAME=$S3_BUCKET</div>
              <div className="mt-4 text-slate-500"># Run once published:</div>
              <div className="text-slate-100 bg-slate-900 p-3 rounded-lg border border-slate-800 mt-2 select-all">
                <span>$ docker-compose up -d</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}