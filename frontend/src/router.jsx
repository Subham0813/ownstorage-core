import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import { RequireAuth, RequireGuest, RequireAdmin, GuestLanding } from "./routes/guards";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ScrollToTop from "./components/common/ScrollToTop";
import { AppProvider } from "./context/AppContext";
import { OtpProvider } from "./context/OtpContext";

const ReactQueryProvider = lazy(() => import("./providers/ReactQueryProvider"));
const AppLayout = lazy(() => import("./components/layout/AppLayout"));
const AuthLayout = lazy(() => import("./routes/AuthLayout"));

// Public pages
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const UserAgreement = lazy(() => import("./pages/UserAgreement"));
const PublicShareView = lazy(() => import("./pages/PublicShareView"));

// Auth pages
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const Register = lazy(() => import("./pages/auth/Register"));
const VerifyOtp = lazy(() => import("./pages/auth/VerifyOtp"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ChangePassword = lazy(() => import("./pages/auth/ChangePassword"));
const OAuthCallback = lazy(() => import("./pages/auth/OAuthCallback"));
const AuthSuccess = lazy(() => import("./pages/auth/AuthSuccess"));

// Dashboard pages
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const AllFiles = lazy(() => import("./pages/dashboard/AllFiles"));
const Shared = lazy(() => import("./pages/dashboard/Shared"));
const Trash = lazy(() => import("./pages/dashboard/Trash"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const SearchResults = lazy(() => import("./pages/dashboard/SearchResults"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));

const Spinner = () => (
  <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#09090b]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-slate-400">Loading...</span>
    </div>
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<Spinner />}>
    <ScrollToTop />
    <Outlet />
  </Suspense>
);

export const router = createBrowserRouter(
  [
    {
      element: (
        <Suspense fallback={<Spinner />}>
          <ReactQueryProvider>
            <AppProvider>
              <OtpProvider>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </OtpProvider>
            </AppProvider>
          </ReactQueryProvider>
        </Suspense>
      ),
      errorElement: <Spinner />,
      children: [
        // Public routes
        { path: "/", element: <GuestLanding /> },
        { path: "/share/:token", element: <PublicShareView /> },
        { path: "/terms", element: <TermsPage /> },
        { path: "/privacy", element: <PrivacyPolicy /> },
        { path: "/agreement", element: <UserAgreement /> },
        { path: "/pricing", element: <Navigate to="/" replace /> },
        { path: "/pricing/*", element: <Navigate to="/" replace /> },
        { path: "/subscription", element: <Navigate to="/" replace /> },

        // OAuth callbacks — no auth guard
        { path: "/google", element: <AuthLayout><OAuthCallback /></AuthLayout> },
        { path: "/github", element: <AuthLayout><OAuthCallback /></AuthLayout> },
        { path: "/google-drive", element: <AuthLayout><OAuthCallback /></AuthLayout> },
        { path: "/auth/callback/:provider", element: <AuthLayout><OAuthCallback /></AuthLayout> },
        { path: "/auth/google", element: <AuthLayout><OAuthCallback /></AuthLayout> },

        // Guest-only routes
        { path: "/verify-otp", element: <AuthLayout><VerifyOtp /></AuthLayout> },
        { path: "/forgot-password", element: <AuthLayout><ForgotPassword /></AuthLayout> },
        { path: "/change-password", element: <AuthLayout><ChangePassword /></AuthLayout> },
        {
          element: <RequireGuest />,
          children: [
            { path: "/signin", element: <AuthLayout><SignIn /></AuthLayout> },
            { path: "/register", element: <AuthLayout><Register /></AuthLayout> },
            { path: "/auth-success", element: <AuthLayout><AuthSuccess /></AuthLayout> },
          ],
        },

        // Dashboard (auth required)
        {
          element: <RequireAuth />,
          children: [
            {
              element: <AppLayout />,
              children: [
                { path: "/home", element: <Dashboard /> },
                { path: "/myfiles", element: <AllFiles /> },
                { path: "/myfiles/folders/:id", element: <AllFiles /> },
                { path: "/shared", element: <Shared /> },
                { path: "/shared/folders/:id", element: <Shared /> },
                { path: "/bin", element: <Trash /> },
                { path: "/trash", element: <Navigate to="/bin" replace /> },
                { path: "/settings", element: <Settings /> },
                { path: "/search", element: <SearchResults /> },
              ],
            },

            // Admin (admin required)
            {
              element: <RequireAdmin />,
              children: [
                {
                  element: <AppLayout />,
                  children: [
                    { path: "/admin", element: <AdminDashboard /> },
                    { path: "/admin/users", element: <AdminUsers /> },
                    { path: "/admin/users/:id", element: <AdminUserDetail /> },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_startTransition: true,
    },
  }
);