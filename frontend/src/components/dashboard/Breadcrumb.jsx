import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";

/**
 * Track whether the breadcrumb bar overflows its container and whether we're
 * below the `sm` breakpoint. When overflowing on larger screens, middle crumbs
 * are collapsed into an ellipsis menu. Hysteresis keeps the collapsed state
 * stable (no flicker between two layouts).
 */
export function useBreadcrumbCollapse(itemCount) {
  const navRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isSmall, setIsSmall] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches
  );

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const applyMq = () => setIsSmall(mq.matches);
    applyMq();
    mq.addEventListener?.("change", applyMq);

    const nav = navRef.current;
    if (!nav) {
      return () => mq.removeEventListener?.("change", applyMq);
    }

    let prevWidth = 0;
    const measure = () => {
      const width = nav.clientWidth;
      const overflowing = nav.scrollWidth > width + 1;
      const grew = width > prevWidth + 24;
      prevWidth = width;
      setCollapsed((prev) => {
        if (overflowing) return true;
        if (grew) return false;
        return prev;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    window.addEventListener("resize", measure);
    return () => {
      mq.removeEventListener?.("change", applyMq);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [itemCount, isSmall]);

  return { navRef, collapsed, isSmall };
}

/**
 * Split crumbs into a `leading` root crumb, a `trailing` window, and the
 * `hidden` middle. When collapsed, keep the root + last `keep` crumbs visible
 * and pull everything between into `hidden`.
 */
export function partitionCrumbs(items, collapsed, keep = 2) {
  if (!collapsed || items.length <= keep + 1) {
    return { leading: items.slice(0, 1), trailing: items.slice(1), hidden: [] };
  }
  return {
    leading: items.slice(0, 1),
    trailing: items.slice(items.length - keep),
    hidden: items.slice(1, items.length - keep),
  };
}

/**
 * "..." button that opens a dropdown of the hidden intermediate folders.
 * Positioned with `fixed` so it isn't clipped by the breadcrumb's
 * overflow-x-auto ancestors.
 */
export function EllipsisMenu({ items, linkFor }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);

  const openMenu = () => {
    const r = btnRef.current.getBoundingClientRect();
    setPos({ left: Math.max(8, r.left), top: r.bottom + 6 });
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={open ? () => setOpen(false) : openMenu}
        className="px-1.5 py-0.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors font-bold shrink-0"
        title="Show intermediate folders"
        aria-label="Show intermediate folders"
      >
        …
      </button>
      {open && pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 min-w-[160px] max-w-[280px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl py-1.5 max-h-[260px] overflow-y-auto"
            style={{ left: pos.left, top: pos.top }}
          >
            {items.map((item) => (
              <Link
                key={item.id}
                to={linkFor(item)}
                onClick={() => setOpen(false)}
                className="block py-0.5 px-3 sm:py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 truncate"
                title={item.name}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function Crumb({ item, isLast, noChevron = false, linkFor }) {
  const to = linkFor(item);
  return (
    <span className="flex items-center gap-1 shrink-0">
      {!noChevron && (
        <Icon
          name="chevronRight"
          size={12}
          className="text-slate-400 dark:text-zinc-400 shrink-0"
        />
      )}
      {isLast ? (
        <span
          className="font-bold text-slate-900 dark:text-zinc-100 truncate max-w-[180px] sm:max-w-[240px] px-1.5 py-0.5 rounded-lg bg-slate-100/60 dark:bg-zinc-800/60"
          title={item.name}
        >
          {item.name}
        </span>
      ) : (
        <Link
          to={to}
          className="px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[140px] sm:max-w-[180px]"
          title={item.name}
        >
          {item.name}
        </Link>
      )}
    </span>
  );
}

const driveLinkFor = (item) =>
  item.id === "root" ? "/myfiles" : `/myfiles/folders/${item.id}`;

export function Breadcrumb({ items = [] }) {
  const { navRef, collapsed, isSmall } = useBreadcrumbCollapse(items.length);

  if (items.length === 0) return null;

  const { leading, trailing, hidden } = isSmall
    ? { leading: [], trailing: items.slice(-1), hidden: items.slice(0, -1) }
    : partitionCrumbs(items, collapsed);

  return (
    <nav
      ref={navRef}
      className="flex items-center gap-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 overflow-x-auto no-scrollbar py-1 select-none"
    >
      {/* Home icon link */}
      <Link
        to="/myfiles"
        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
        title="My Files"
      >
        <Icon name="home" size={16} />
      </Link>

      {leading.map((item) => (
        <Crumb
          key={item.id}
          item={item}
          isLast={trailing.length === 0}
          noChevron
          linkFor={driveLinkFor}
        />
      ))}

      {hidden.length > 0 && <EllipsisMenu items={hidden} linkFor={driveLinkFor} />}

      {trailing.map((item, i) => (
        <Crumb
          key={item.id}
          item={item}
          isLast={i === trailing.length - 1}
          linkFor={driveLinkFor}
        />
      ))}
    </nav>
  );
}
