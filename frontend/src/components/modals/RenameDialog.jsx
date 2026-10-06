import { useState, useEffect, useRef } from "react";
import { ModalOverlay, ModalHeader, ModalFooter, Btn, Input } from "../ui/UI";

export function RenameDialog({ item, isOpen, onClose, onRename }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && item) {
      const isDir = item.type === "directory";
      const baseName = isDir ? item.name : item.name.replace(/\.[^.]+$/, "");
      setName(baseName);
    }
  }, [isOpen, item]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.select(), 100);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const isDir = item.type === "directory";
  const ext = isDir ? "" : item.name.match(/\.[^.]+$/)?.[0] || "";
  const trimmedName = name.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !trimmedName ||
      trimmedName === (isDir ? item.name : item.name.replace(/\.[^.]+$/, ""))
    ) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      await onRename(item, trimmedName + ext);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth="max-w-md">
      <ModalHeader
        title="Rename Item"
        sub={`Enter a new name for "${item.name}"`}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter new name"
          autoFocus
        />
        {ext && (
          <p className="text-xs font-medium text-slate-400 dark:text-zinc-400 mt-2.5">
            File extension{" "}
            <span className="font-mono text-slate-600 dark:text-zinc-300 font-semibold">
              {ext}
            </span>{" "}
            will be automatically preserved.
          </p>
        )}
        <ModalFooter>
          <Btn variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Btn>
          <Btn
            variant="primary"
            type="submit"
            disabled={loading || !trimmedName}
          >
            {loading ? "Renaming..." : "Save Name"}
          </Btn>
        </ModalFooter>
      </form>
    </ModalOverlay>
  );
}
