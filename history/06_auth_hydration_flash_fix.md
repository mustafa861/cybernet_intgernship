# Prompt

**User:** Upon reloading the page, the login screen momentarily appears despite the user being in an authenticated state. The authenticated content only becomes visible after clicking a navigation link. This suggests that the authentication state is not being restored synchronously during the initial render — the token exists in localStorage but the React context has not yet hydrated. Please resolve this so the authenticated content renders immediately on page reload without any flash of the login screen.

---

## Response

**OpenCode:** Diagnosed that all protected page components were reading `isAuthenticated` directly from the `useAuth` hook, which initializes as `false` before the `useEffect` in `AuthProvider` reads `localStorage`. Seven pages performed the redirect inside a `useEffect` — which captured a stale closure with `isAuthenticated === false` — while three pages performed it inline during render, causing an immediate navigation to `/login` before hydration could complete.

**Resolution:** Created a `useAuthGuard()` hook that:
1. Reads both `isAuthenticated` and the existing `hydrated` flag from context
2. Only triggers `router.replace("/login")` when `hydrated === true && isAuthenticated === false`
3. Returns a `ready` computed property (`hydrated && isAuthenticated`)

Updated all ten protected pages to destructure `ready` from `useAuthGuard()`, guard renders with `if (!ready) return null`, and removed all manual `router.push("/login")` invocations and redundant `useRouter` imports.
