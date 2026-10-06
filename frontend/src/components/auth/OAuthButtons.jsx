import { oauthAPI } from "../../api/oauthApi";

/* Google's official G logo — exact brand colors, exact proportions */
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
);

const GithubLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

/* Google Drive's official 3-color triangular logo SVG */
const GoogleDriveLogo = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FFC107" d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5z" />
    <path fill="#00AC47" d="M16.29 3.5H7.71l6.56 11.5h8.58z" />
    <path fill="#2684FC" d="M4.58 21l3.43-6h14.84l-3.43 6z" />
  </svg>
);

export default function OAuthButtons({ label = "Sign in with Google" }) {
  const isSignUp = label.toLowerCase().includes("up");
  const actionText = isSignUp ? "Sign up" : "Sign in";

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={oauthAPI.googleConnect}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-full border border-[#dadce0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#3c4043] dark:text-zinc-200 text-sm font-medium hover:bg-[#f8f9fa] dark:hover:bg-zinc-700 hover:border-[#c6c6c6] dark:hover:border-zinc-600 hover:shadow-sm active:bg-[#f1f3f4] dark:active:bg-zinc-600 active:scale-[.99] transition-[background-color,border-color,box-shadow,transform] duration-150 select-none"
        style={{ fontFamily: "'Google Sans', Roboto, Arial, sans-serif" }}
      >
        <GoogleLogo />
        {actionText} with Google
      </button>

      <button
        onClick={oauthAPI.githubConnect}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-full border border-[#dadce0] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#3c4043] dark:text-zinc-200 text-sm font-medium hover:bg-[#f8f9fa] dark:hover:bg-zinc-700 hover:border-[#c6c6c6] dark:hover:border-zinc-600 hover:shadow-sm active:bg-[#f1f3f4] dark:active:bg-zinc-600 active:scale-[.99] transition-[background-color,border-color,box-shadow,transform] duration-150 select-none"
        style={{ fontFamily: "'Google Sans', Roboto, Arial, sans-serif" }}
      >
        <GithubLogo />
        {actionText} with GitHub
      </button>
    </div>
  );
}

export { GoogleLogo, GithubLogo, GoogleDriveLogo };
