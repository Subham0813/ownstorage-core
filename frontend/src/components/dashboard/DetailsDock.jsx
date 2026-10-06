import { DetailsPanel, DetailsMobileOverlay } from "../modals/DetailsPanel";

export function DetailsDock({
  item,
  open,
  onClose,
  onAction,
  variant,
  readOnly = false,
  breakpoint = "md",
}) {
  return (
    <>
      <div
        className={`shrink-0 h-full transition-[width,opacity] duration-200 ease-in-out hidden ${breakpoint}:block ${
          open
            ? "w-[320px] xl:w-[340px] opacity-100 pl-2.5 sm:pl-3"
            : "w-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="w-[320px] xl:w-[340px] h-full">
          {item && (
            <DetailsPanel
              isOpen={open}
              item={item}
              onClose={onClose}
              onAction={onAction}
              variant={variant}
              readOnly={readOnly}
            />
          )}
        </div>
      </div>

      {/* Mobile details overlay (inline panel shows at md+, so phones only) */}
      <DetailsMobileOverlay
        item={item}
        isOpen={open}
        onClose={onClose}
        onAction={onAction}
        hideFrom={breakpoint}
        variant={variant}
        readOnly={readOnly}
      />
    </>
  );
}
