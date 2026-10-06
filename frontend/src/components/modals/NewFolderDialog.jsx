import { useState, useEffect, useRef } from "react";
import { ModalOverlay, ModalHeader, ModalFooter, Btn, Input } from "../ui/UI";

export function NewFolderDialog({ isOpen, parentName, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmedName = name.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trimmedName) return;
    setLoading(true);
    try {
      await onCreate(trimmedName);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth="max-w-md">
      <ModalHeader title="New Folder" sub="Create a new folder to organize files" onClose={onClose} />
      <form onSubmit={handleSubmit}>
        {parentName && (
          <div className="text-xs text-slate-500 dark:text-zinc-400 mb-3 bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800">
            Location: <span className="font-bold text-slate-800 dark:text-zinc-200">/{parentName}</span>
          </div>
        )}
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name (e.g. Documents, Assets)"
        />
        <ModalFooter>
          <Btn variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Btn>
          <Btn
            variant="primary"
            type="submit"
            disabled={loading || !trimmedName}
          >
            {loading ? "Creating..." : "Create Folder"}
          </Btn>
        </ModalFooter>
      </form>
    </ModalOverlay>
  );
}

