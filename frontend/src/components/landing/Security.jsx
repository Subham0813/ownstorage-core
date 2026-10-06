import { Section } from "./Section";
import { Icon } from "../ui/Icon";
import { SECURITY_CARDS } from "../../data/landingContent";

const SECURITY_ICONS = {
  lock: "lock",
  shield: "shield",
  server: "hardDrive",
  zap: "zap",
};

const SECURITY_STEPS = [
  {
    step: "01",
    title: "Client & Session",
    desc: "TLS 1.3 transit with OTP verification and CSRF token origin checks.",
    icon: "shield",
  },
  {
    step: "02",
    title: "Encrypted Vault",
    desc: "AES-256 encryption at rest across multi-region availability zones.",
    icon: "lock",
  },
  {
    step: "03",
    title: "Signed CDN Delivery",
    desc: "Short-lived cryptographically signed URLs — zero unauthorized access.",
    icon: "zap",
  },
];

export function Security() {
  return (
    <Section className="py-12 sm:py-14 lg:py-16 bg-slate-100/70 dark:bg-zinc-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Zero-Trust Architecture
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
            Bank-Grade Security{" "}
            <span className="gradient-text">Built Into Every Layer</span>
          </h2>
          <p className="text-slate-600 dark:text-zinc-400 mt-4 text-base sm:text-lg">
            Every file is isolated, encrypted at rest, and served via signed
            CDN tokens. Your data is strictly private by default.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SECURITY_CARDS.map((s) => (
            <div
              key={s.title}
              className="p-6 rounded-2xl glass-card hover:border-blue-500/40 hover:-translate-y-0.5 transition-[border-color,transform] duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Icon name={SECURITY_ICONS[s.icon] || "shield"} size={19} />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-2">
                {s.title}
              </h4>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
