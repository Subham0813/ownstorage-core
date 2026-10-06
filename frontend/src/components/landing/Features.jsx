import { Section } from "./Section";
import { Icon } from "../ui/Icon";
import { FEATURES } from "../../data/landingContent";

const FEATURE_ICONS = {
  upload: "upload",
  share: "share",
  preview: "eye",
  star: "star",
  trash: "trash",
  cloud: "cloud",
};

export function Features() {
  return (
    <Section id="features" className="py-12 sm:py-14 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Core Capabilities
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
            Everything You Need to{" "}
            <span className="gradient-text">Manage &amp; Scale</span>
          </h2>
          <p className="text-slate-600 dark:text-zinc-400 mt-4 text-base sm:text-lg">
            High-performance cloud storage for individuals and teams who care
            about control, speed, and privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl glass-card hover:border-blue-500/40 hover:-translate-y-0.5 transition-[border-color,transform] duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Icon name={FEATURE_ICONS[f.icon] || "cloud"} size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
