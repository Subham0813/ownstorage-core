const SCRIPTS = [
  { src: "https://apis.google.com/js/api.js", check: () => !!window.gapi },
  { src: "https://accounts.google.com/gsi/client", check: () => !!window.google?.accounts },
];

let loaded = false;
let loading = null;

function inject(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export function loadGoogleApis() {
  if (loaded) return Promise.resolve();
  if (loading) return loading;

  loading = (async () => {
    for (const { src, check } of SCRIPTS) {
      if (!check()) await inject(src);
    }
    loaded = true;
  })();

  return loading;
}
