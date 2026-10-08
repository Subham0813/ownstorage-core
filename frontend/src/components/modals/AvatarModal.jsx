import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ModalOverlay, ModalHeader, ModalFooter, Btn } from "../ui/UI";
import { Icon } from "../ui/Icon";
import { useApp } from "../../context/AppContext";
import { homeAPI } from "../../api/userApi";
import { getInitials } from "../../utils/fileUtils";

const MAX_DIM = 512;
const MAX_BYTES = 1024 * 1024;

const compressToSquareDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const size = Math.min(MAX_DIM, img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size);
        for (const quality of [0.85, 0.65, 0.45]) {
          const dataUrl = canvas.toDataURL("image/webp", quality);
          const bytes = (dataUrl.length - `data:image/webp;base64,`.length) * 0.75;
          if (bytes <= MAX_BYTES) {
            resolve({ dataUrl, bytes });
            return;
          }
        }
        reject(new Error("size"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export function AvatarModal({ isOpen, onClose }) {
  const { user, refreshUser, showMessage } = useApp();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPreview(null);
      setFileName("");
      setSavingError(false);
    }
  }, [isOpen]);

  const handlePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showMessage("error", "Please choose an image file.");
      return;
    }
    try {
      const { dataUrl } = await compressToSquareDataUrl(file);
      setPreview(dataUrl);
      setFileName(file.name);
      setSavingError(false);
    } catch (err) {
      if (err?.message === "size") {
        setSavingError(true);
        showMessage("error", "Image is too large. Try a smaller image.");
      } else {
        showMessage("error", "Could not read that image.");
      }
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await homeAPI.updateAvatar(preview);
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      refreshUser?.();
      showMessage("success", "Avatar picture updated");
      onClose();
    } catch {
      showMessage("error", "Failed to update avatar picture");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose} maxWidth="max-w-sm">
      <ModalHeader
        title="Profile Picture"
        sub="Choose a new avatar image"
        onClose={onClose}
      />

      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-28 h-28 rounded-[28px] bg-gradient-to-tr from-blue-500 to-indigo-500 ring-2 ring-blue-200 dark:ring-blue-900/60 flex items-center justify-center text-white text-4xl font-black overflow-hidden shadow-lg shadow-blue-500/25 border-2 border-white dark:border-zinc-800">
            {preview ? (
              <img
                src={preview}
                alt="New avatar"
                className="w-full h-full object-cover"
              />
            ) : user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(user?.name)
            )}
          </div>
          {saving && (
            <div className="absolute inset-0 bg-black/50 rounded-[28px] flex items-center justify-center">
              <Icon
                name="spinner"
                size={26}
                className="animate-spin text-white"
              />
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200">
            {preview ? fileName : user?.name || "Your avatar"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Square images up to 512×512 px work best.
          </p>
        </div>

        {savingError && (
          <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200/70 dark:border-rose-500/25 rounded-xl px-3 py-2">
            Image is too large after compression. Pick a smaller image.
          </p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handlePick}
          className="hidden"
        />
      </div>

      <ModalFooter className="mt-6" center>
        <Btn variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Btn>
        <Btn
          variant="ghost"
          onClick={() => fileRef.current?.click()}
          disabled={saving}
        >
          <Icon name="camera" size={14} />
          {preview ? "Choose Another" : "Choose Image"}
        </Btn>
        <Btn
          variant="primary"
          onClick={handleSave}
          disabled={!preview || saving}
          className="min-w-[110px]"
        >
          {saving ? "Saving..." : "Save Picture"}
        </Btn>
      </ModalFooter>
    </ModalOverlay>
  );
}
