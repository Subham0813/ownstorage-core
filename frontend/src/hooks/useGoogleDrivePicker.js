import { useRef } from "react";
import { loadGoogleApis } from "../utils/loadGoogleApis";

/**
 * useGoogleDrivePicker
 * Returns a function that opens the Google Drive Picker with a given access token.
 * The picked files are handed to `onPick` as an array of Drive docs.
 */
export function useGoogleDrivePicker(onPick) {
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  return async (token) => {
    if (!token) return;

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕  Close";
    closeBtn.style.cssText = [
      "position:fixed", "top:16px", "right:20px", "z-index:1001",
      "background:#0f1923", "border:1px solid #1e2f3f", "color:#c8d8e8",
      "font-size:13px", "font-weight:600", "padding:6px 14px",
      "border-radius:8px", "cursor:pointer", "line-height:1",
    ].join(";");
    document.body.appendChild(closeBtn);

    let picker = null;
    const destroy = () => {
      picker?.setVisible(false);
      closeBtn.remove();
    };
    closeBtn.onclick = destroy;

    try {
      await loadGoogleApis();
    } catch {
      closeBtn.remove();
      return;
    }

    window.gapi.load("picker", () => {
      picker = new window.google.picker.PickerBuilder()
        .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
        .setOAuthToken(token)
        .addView(window.google.picker.ViewId.DOCS)
        .addView(window.google.picker.ViewId.FOLDERS)
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .setAppId(import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_NUMBER)
        .setOrigin(window.location.protocol + "//" + window.location.host)
        .setCallback((data) => {
          if (data.action === window.google.picker.Action.PICKED) {
            pickRef.current?.(data.docs);
            destroy();
          }
          if (data.action === window.google.picker.Action.CANCEL) {
            destroy();
          }
        })
        .build();
      picker.setVisible(true);
    });
  };
}
