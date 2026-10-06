import { useState } from "react";
import { Section } from "./Section";
import { Icon } from "../ui/Icon";
import { FAQS } from "../../data/landingContent";

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
      >
        <span className="text-base font-semibold text-slate-900 dark:text-zinc-100">
          {q}
        </span>
        <Icon
          name="chevronDown"
          size={16}
          className={`text-slate-400 dark:text-zinc-500 shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-blue-600 dark:text-blue-400" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  return (
    <Section id="faq" className="py-12 sm:py-14 lg:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight mb-3">
            Frequently Asked{" "}
            <span className="gradient-text">Questions</span>
          </h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </Section>
  );
}
