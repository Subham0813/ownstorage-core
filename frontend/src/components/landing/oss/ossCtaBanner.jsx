import { useNavigate } from "react-router-dom";
import { Section } from "../Section";
import { Icon } from "../../ui/Icon";
import { GITHUB_URL } from "../../../data/oss";

export function OSSCtaBanner() {
  const navigate = useNavigate();
  return (
    <Section className="py-12 sm:py-14 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-xl overflow-hidden p-8 sm:p-12 lg:p-14 text-center bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight mb-4 text-white">
              Own Your Files. Own Your Storage.
            </h2>
            <p className="text-blue-100 text-base sm:text-lg max-w-xl mx-auto mb-8 font-medium">
              Grab the open-source code and host it yourself — deploy on your
              own server, VPS, or home NAS in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-full text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-lg shadow-slate-900/20 transition-[background-color] cursor-pointer"
              >
                <Icon name="github" size={16} />
                Star on GitHub
              </a>
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-full text-sm font-bold text-white bg-white/15 hover:bg-white/25 border border-white/30 transition-[background-color,border-color] cursor-pointer"
              >
                Start Ownstorage
                <Icon name="arrowRight" size={16} />
              </button>
            </div>
            <p className="text-xs text-blue-100 mt-5">
              Self-hosting is free forever · No accounts, plans, or credit cards
              required
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
