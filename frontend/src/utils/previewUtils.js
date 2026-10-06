export const PREVIEW_TYPES = {
  image: "image",
  video: "video",
  audio: "audio",
  document: "document",
  text: "text",
  none: "none",
};

export function getPreviewType(mime = "", ext = "") {
  const m = String(mime || "").toLowerCase();
  const e = String(ext || "").toLowerCase();

  if (m.startsWith("image/")) return PREVIEW_TYPES.image;
  if (m.startsWith("video/")) return PREVIEW_TYPES.video;
  if (m.startsWith("audio/")) return PREVIEW_TYPES.audio;
  if (m === "application/pdf" || e === "pdf") return PREVIEW_TYPES.document;
  if (
    m.startsWith("text/") ||
    ["application/json", "application/xml", "application/javascript"].includes(m)
  )
    return PREVIEW_TYPES.text;
  return PREVIEW_TYPES.none;
}
