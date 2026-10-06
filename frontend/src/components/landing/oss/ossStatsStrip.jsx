import { Section } from "../Section";
import { STATS } from "../../../data/landingContent";

export function OSSStatsStrip() {
  return (
    <Section className="py-10 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 rounded-xl glass-card px-6 py-8 sm:py-10">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-display gradient-text">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
