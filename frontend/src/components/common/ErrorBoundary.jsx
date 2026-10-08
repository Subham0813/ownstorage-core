import React from "react";

function getStoredUser() {
  try {
    const u = JSON.parse(localStorage.getItem("userdata") ?? "null");
    return u && typeof u === "object" && u?.id ? u : null;
  } catch {
    return null;
  }
}

function generateErrorId() {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID().slice(0, 8).toUpperCase();
  }
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function extractUserContext() {
  const user = getStoredUser();
  return {
    userId: user?.id ?? null,
    role: user?.role ?? null,
  };
}

function isChunkLoadError(error) {
  if (!error) return false;
  const text = `${error?.message || ""} ${error?.stack || ""}`;
  return (
    /dynamically imported module/i.test(text) ||
    /Importing a module script failed/i.test(text) ||
    /Error loading dynamically imported module/i.test(text) ||
    /Loading chunk [\w-]+ failed/i.test(text)
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, errorId: generateErrorId() };
  }

  componentDidCatch(error, errorInfo) {
    const { errorId } = this.state;
    const payload = {
      source: "react-error-boundary",
      errorId,
      name: error?.name || "Error",
      message: error?.message || "(no message)",
      stack: error?.stack || null,
      componentStack: errorInfo?.componentStack || null,
      href: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...extractUserContext(),
    };
    console.error("[ErrorBoundary] Reported crash:", payload, error);
    window.dispatchEvent(new CustomEvent("app:crash", { detail: payload }));

    // Chunk-load failures happen when a tab is open across a deploy: the old
    // index.html references chunks that no longer exist, so the lazy import
    // 404s. Reload (once, throttled) so the fresh index.html loads the new
    // bundle instead of showing the crash fallback.
    if (isChunkLoadError(error)) {
      const lastReload = Number(sessionStorage.getItem("eb:reloaded") || 0);
      if (Date.now() - lastReload > 5000) {
        sessionStorage.setItem("eb:reloaded", String(Date.now()));
        window.location.reload();
      }
    }
  }

  handleTryAgain = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  handleCopyErrorId = () => {
    navigator.clipboard
      ?.writeText(this.state.errorId ?? "")
      .then(() => this.setState({ copied: true }))
      .catch(() => this.setState({ copied: false }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { errorId, copied } = this.state;
    const user = getStoredUser();
    const secondary = user
      ? { label: "Back to app", href: "/" }
      : { label: "Return to Sign In", href: "/signin" };

    try {
      return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-600 to-indigo-600 dark:from-zinc-900 dark:to-purple-900 px-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-600 dark:text-zinc-400 mb-4">
              We're sorry for the inconvenience. Please try reloading the page.
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mb-6">
              Reference&nbsp;
              <button
                onClick={this.handleCopyErrorId}
                className="font-mono text-slate-500 dark:text-zinc-400 hover:underline"
                title="Copy error reference"
              >
                {errorId}
                {copied ? " · copied" : ""}
              </button>
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleTryAgain}
                className="w-full py-3.5 bg-linear-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-[box-shadow]"
              >
                Try again
              </button>
              <a
                href={secondary.href}
                className="w-full py-3.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-[background-color]"
              >
                {secondary.label}
              </a>
              <button
                onClick={this.handleGoBack}
                className="text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      );
    } catch {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-900 px-4">
          <div className="text-center text-zinc-100">
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <button
              onClick={this.handleTryAgain}
              className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
  }
}

export default ErrorBoundary;