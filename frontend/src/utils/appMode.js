const raw = (
  import.meta.env.VITE_APP_MODE || "selfhosted"
)
  .toLowerCase()
  .trim();

export const APP_MODE =
  raw === "selfhosted" || raw === "self-hosted" || raw === "local"
    ? "selfhosted"
    : "saas";

export const isSaaS = APP_MODE === "saas";
export const isSelfHosted = !isSaaS;
