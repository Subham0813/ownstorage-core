export const isDirItem = (item) =>
  !item.mime || item.type === "directory";

export async function getPublicLinkToken(api, itemId) {
  const res = await api.getShareInfo(itemId, { public: 1, limit: 1 });
  return res.data?.data?.publicPermission?.token || null;
}

export async function copyPublicLink(token, showMessage) {
  const link = `${window.location.origin}/share/${token}`;
  navigator.clipboard?.writeText(link).then(
    () => showMessage("success", "Link copied to clipboard"),
    () => showMessage("error", "Failed to copy link"),
  );
}
