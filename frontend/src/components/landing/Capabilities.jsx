import { Section } from "./Section";
import { Icon } from "../ui/Icon";
import { CAPABILITIES } from "../../data/landingContent";

export function Capabilities() {
  return (
    <Section className="py-12 sm:py-14 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              What's Included
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
            Everything in the{" "}
            <span className="gradient-text">Box</span>
          </h2>
        </div>

        <div className="rounded-2xl glass-card p-6 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap}
                className="flex items-center gap-3 text-sm text-slate-700 dark:text-zinc-300"
              >
                <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Icon name="check" size={11} />
                </span>
                {cap}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}