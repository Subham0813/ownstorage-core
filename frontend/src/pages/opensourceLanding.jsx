import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import PublicHeader from "../components/layout/PublicHeader";
import PublicFooter from "../components/layout/PublicFooter";
import { OSSHero } from "../components/landing/oss/ossHero";
import { OSSStatsStrip } from "../components/landing/oss/ossStatsStrip";
import { OSSOpenSource } from "../components/landing/oss/ossOpenSource";
import { OSSSelfHosted } from "../components/landing/oss/ossSelfHosted";
import { OSSCtaBanner } from "../components/landing/oss/ossCtaBanner";
import { Features } from "../components/landing/Features";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Capabilities } from "../components/landing/Capabilities";
import { Security } from "../components/landing/Security";
import { Faq } from "../components/landing/Faq";
import { Section } from "../components/landing/Section";
import { Icon } from "../components/ui/Icon";
import { GITHUB_URL } from "../data/oss";

function FreeCta() {
  const navigate = useNavigate();
  const { user } = useApp();
  return (
    <Section id="pricing" className="py-12 sm:py-14 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-xl overflow-hidden p-8 sm:p-12 lg:p-14 text-center bg-slate-900 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-5">
              <Icon name="checkCircle" size={12} />
              Free & Open Source
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight mb-4 text-white">
              No Plans. No Pricing Tiers. Just OwnStorage.
            </h2>
            <p className="text-slate-300 dark:text-zinc-300 text-base sm:text-lg max-w-xl mx-auto mb-8 font-medium">
              Every feature is included — unlimited users, full activity and
              session control, and generous per-user quota limits that you set
              yourself. Self-host for free, forever.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate(user?.id ? "/home" : "/register")}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-full text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 shadow-lg shadow-blue-500/25 transition-[filter] cursor-pointer"
              >
                Get Started for Free
                <Icon name="arrowRight" size={16} />
              </button>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-full text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-lg shadow-slate-900/20 transition-[background-color] cursor-pointer"
              >
                <Icon name="github" size={16} />
                Star on GitHub
              </a>
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-5">
              Self-hosting is free forever · No accounts, plans, or credit cards
              required
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default function OpenSourceLanding() {
  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.replace("#", "");
      if (id) {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans overflow-x-hidden dashboard-bg">
      <PublicHeader activePage="home" openSource />

      <OSSHero />
      <OSSStatsStrip />
      <OSSOpenSource />
      <Features />
      <OSSSelfHosted />
      <HowItWorks />
      <FreeCta />
      <Capabilities />
      <Security />
      <Faq />
      <OSSCtaBanner />

      <PublicFooter openSource />
    </div>
  );
}