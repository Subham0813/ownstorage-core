import { Section } from "./Section";
import { STEPS } from "../../data/landingContent";

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      className="py-12 sm:py-14 lg:py-16 bg-slate-100/70 dark:bg-zinc-900/40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              How It Works
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
            Up and Running in{" "}
            <span className="gradient-text">3 Steps</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {STEPS.map((s, i) => (
            <div key={s.num} className="relative">
              <div className="text-center p-7 rounded-2xl glass-card hover:border-blue-500/40 transition-[border-color] duration-300">
                <div className="w-12 h-12 rounded-xl font-display text-lg font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-slate-300 dark:bg-zinc-700" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
