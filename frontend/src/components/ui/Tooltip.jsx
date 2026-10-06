import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export function Tooltip({ children, content, position = "top", delay = 100, className = "inline-flex max-w-full min-w-0" }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);
  const animFrameRef = useRef(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsAnimating(false);
    setIsVisible(false);
  };

  const openTooltip = () => {
    updateCoords();
    setIsVisible(true);
    animFrameRef.current = requestAnimationFrame(() => {
      setIsAnimating(true);
    });
  };

  const showTooltip = (withDelay = true) => {
    updateCoords();
    if (withDelay) {
      timeoutRef.current = setTimeout(openTooltip, delay);
    } else {
      openTooltip();
    }
  };

  const isCoarsePointer = () =>
    window.matchMedia?.("(hover: none)").matches || window.matchMedia?.("(pointer: coarse)").matches;

  useEffect(() => {
    if (isVisible) {
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
      return () => {
        window.removeEventListener("scroll", updateCoords, true);
        window.removeEventListener("resize", updateCoords);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const onDocumentClick = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        hideTooltip();
      }
    };
    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [isVisible]);

  if (!content) return children;

  const handleMouseEnter = () => showTooltip(true);
  const handleMouseLeave = () => hideTooltip();

  const handleFocus = () => showTooltip(false);
  const handleBlur = () => hideTooltip();

  const handleKeyDown = (e) => {
    if (e.key === "Escape") hideTooltip();
  };

  const handleClick = () => {
    if (isCoarsePointer()) {
      if (isVisible) hideTooltip();
      else showTooltip(false);
    }
  };

  let tooltipStyle = {};
  const arrowClasses = {
    top: "-bottom-[5px] left-1/2 -translate-x-1/2 border-r border-b",
    "top-left": "-bottom-[5px] left-3.5 border-r border-b",
    "top-right": "-bottom-[5px] right-3.5 border-r border-b",
    bottom: "-top-[5px] left-1/2 -translate-x-1/2 border-l border-t",
    "bottom-left": "-top-[5px] left-3.5 border-l border-t",
    "bottom-right": "-top-[5px] right-3.5 border-l border-t",
    left: "-right-[5px] top-1/2 -translate-y-1/2 border-t border-r",
    right: "-left-[5px] top-1/2 -translate-y-1/2 border-b border-l",
  };

  if (coords) {
    const offset = 9;
    const baseTransform = {
      top: isAnimating ? "translate(-50%, -100%) scale(1)" : "translate(-50%, -92%) scale(0.92)",
      "top-left": isAnimating ? "translateY(-100%) scale(1)" : "translateY(-92%) scale(0.92)",
      "top-right": isAnimating ? "translate(-100%, -100%) scale(1)" : "translate(-100%, -92%) scale(0.92)",
      bottom: isAnimating ? "translateX(-50%) scale(1)" : "translate(-50%, 4px) scale(0.92)",
      "bottom-left": isAnimating ? "scale(1)" : "translateY(4px) scale(0.92)",
      "bottom-right": isAnimating ? "translateX(-100%) scale(1)" : "translate(-100%, 4px) scale(0.92)",
      left: isAnimating ? "translate(-100%, -50%) scale(1)" : "translate(-92%, -50%) scale(0.92)",
      right: isAnimating ? "translateY(-50%) scale(1)" : "translate(4px, -50%) scale(0.92)",
    };

    switch (position) {
      case "top":
        tooltipStyle = {
          top: `${coords.top - offset}px`,
          left: `${coords.left + coords.width / 2}px`,
        };
        break;
      case "top-left":
        tooltipStyle = {
          top: `${coords.top - offset}px`,
          left: `${coords.left}px`,
        };
        break;
      case "top-right":
        tooltipStyle = {
          top: `${coords.top - offset}px`,
          left: `${coords.right}px`,
        };
        break;
      case "bottom":
        tooltipStyle = {
          top: `${coords.bottom + offset}px`,
          left: `${coords.left + coords.width / 2}px`,
        };
        break;
      case "bottom-left":
        tooltipStyle = {
          top: `${coords.bottom + offset}px`,
          left: `${coords.left}px`,
        };
        break;
      case "bottom-right":
        tooltipStyle = {
          top: `${coords.bottom + offset}px`,
          left: `${coords.right}px`,
        };
        break;
      case "left":
        tooltipStyle = {
          top: `${coords.top + coords.height / 2}px`,
          left: `${coords.left - offset}px`,
        };
        break;
      case "right":
      default:
        tooltipStyle = {
          top: `${coords.top + coords.height / 2}px`,
          left: `${coords.right + offset}px`,
        };
        break;
    }

    tooltipStyle.transform = baseTransform[position] || baseTransform.top;
    tooltipStyle.opacity = isAnimating ? 1 : 0;
    tooltipStyle.transition = "opacity 140ms cubic-bezier(0.16, 1, 0.3, 1), transform 140ms cubic-bezier(0.16, 1, 0.3, 1)";
  }

  return (
    <div
      ref={triggerRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
      {isVisible &&
        coords &&
        createPortal(
          <div
            className="fixed z-[9999] whitespace-nowrap pointer-events-none"
            style={tooltipStyle}
          >
            <div className="relative px-2.5 py-1 text-xs font-bold font-mono text-slate-100 bg-slate-950/95 dark:bg-zinc-900/95 border border-slate-700/80 rounded-lg shadow-2xl backdrop-blur-xl max-w-xs truncate tracking-tight">
              {content}
              <div
                className={`absolute w-2.5 h-2.5 bg-slate-950/95 dark:bg-zinc-900/95 border-slate-700/80 rotate-45 ${arrowClasses[position] || arrowClasses.top}`}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
