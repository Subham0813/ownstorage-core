import { useState, useCallback } from "react";

export function useItemSelection({ single = false } = {}) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const handleSelect = useCallback(
    (itemId) => {
      setSelectedIds((prev) => {
        if (single) return new Set([itemId]);
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
    },
    [single],
  );

  const handleSelectAll = useCallback((items) => {
    setSelectedIds((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id)),
    );
  }, []);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  return {
    selectedIds,
    setSelectedIds,
    handleSelect,
    handleSelectAll,
    handleClearSelection,
  };
}
