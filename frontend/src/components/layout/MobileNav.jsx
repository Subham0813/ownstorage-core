import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "../ui/Icon";

const MOBILE_NAV_ITEMS = [
  { key: "home", label: "Home", icon: "home", path: "/home" },
  { key: "myfiles", label: "Files", icon: "folder", path: "/myfiles" },
  { key: "shared", label: "Shared", icon: "share", path: "/shared" },
  { key: "bin", label: "Bin", icon: "trash", path: "/bin" },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm select-none safe-area-bottom">
      <div className="flex items-center justify-around gap-1 px-1 py-1 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-slate-300/80 dark:border-zinc-800/80 shadow-xl shadow-slate-950/30 dark:shadow-black/50">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/myfiles" && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-1 py-0.5 rounded-full transition-[color,transform] duration-200 ${
                isActive
                  ? "font-bold scale-105"
                  : "hover:scale-105 active:scale-95"
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-[color,background-color] duration-200 ${
                  isActive
                    ? "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/30 text-white"
                    : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-800 dark:hover:text-zinc-200"
                }`}
              >
                <Icon name={item.icon} size={18} />
              </div>
              <div
                className={`text-xs tracking-tight leading-none ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-zinc-400"
                }`}
              >
                {item.label}
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
