import { useState, useCallback } from "react";

export function useContextMenuState() {
  const [ctxMenu, setCtxMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null,
  });

  const handleContextMenu = useCallback((e, item) => {
    e.preventDefault();
    setCtxMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      item,
    });
  }, []);

  const closeCtxMenu = useCallback(() => {
    setCtxMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return { ctxMenu, setCtxMenu, handleContextMenu, closeCtxMenu };
}
