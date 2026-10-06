import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  useEffect(() => {
    setTimeout(() => navigate("/myfiles", { replace: true }), 800);
  }, [navigate]);
  return (
    <div className="w-full max-w-md relative animate-fadeUp">
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center mx-auto mb-5">
          <Icon name="check" size={36} color="#22c55e" />
        </div>
        <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-zinc-100 mb-2">
          Success!
        </h1>
        <p className="text-sm text-slate-700 dark:text-zinc-300">
          {state?.message || "Successfully authenticated"}
        </p>
      </div>
    </div>
  );
}
