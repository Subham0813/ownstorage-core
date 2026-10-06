import { useCallback } from "react";

export function useItemCard({ item, onSelect, onOpen, onContextMenu }) {
  const handleClick = useCallback(() => {
    // Shelved: selection disabled until bulk operations are built
    // onSelect?.(item.id);
  }, [item.id, onSelect]);

  const handleDoubleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onOpen?.(item);
    },
    [item, onOpen],
  );

  const handleCheckboxClick = useCallback(
    (e) => {
      e.stopPropagation();
      // Shelved: selection disabled until bulk operations are built
      // onSelect?.(item.id);
    },
    [item.id, onSelect],
  );

  const handleOpenClick = useCallback(
    (e) => {
      e.stopPropagation();
      onOpen?.(item);
    },
    [item, onOpen],
  );

  const handleMenuClick = useCallback(
    (e) => {
      e.stopPropagation();
      onContextMenu(e, item);
    },
    [item, onContextMenu],
  );

  const handleContextMenu = useCallback(
    (e) => onContextMenu(e, item),
    [item, onContextMenu],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onOpen?.(item);
      } else if (e.key === " ") {
        e.preventDefault();
        // Shelved: selection disabled until bulk operations are built
        // onSelect?.(item.id);
      }
    },
    [item, onOpen, onSelect],
  );

  return {
    handleClick,
    handleDoubleClick,
    handleCheckboxClick,
    handleOpenClick,
    handleMenuClick,
    handleContextMenu,
    handleKeyDown,
  };
}
