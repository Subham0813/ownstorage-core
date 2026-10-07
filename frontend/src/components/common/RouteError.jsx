import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";

export default function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#09090b] px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-amber-600 dark:text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
          {notFound ? "Page not found" : "Something went wrong"}
        </h1>
        <p className="text-sm text-slate-600 dark:text-zinc-400 mb-6">
          {notFound
            ? "The page you're looking for doesn't exist or has moved."
            : "An unexpected error occurred. Try reloading the page."}
        </p>
        <div className="flex flex-col gap-2">
          <Link
            to="/"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Go to home
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-sm font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
