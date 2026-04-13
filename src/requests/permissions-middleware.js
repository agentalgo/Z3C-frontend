/**
 * Permissions-update middleware
 *
 * Listens for the "permissions:updated" CustomEvent that api.config.js dispatches
 * whenever an API call returns HTTP 401 with error.reason === "PERMISSIONS_UPDATED".
 *
 * The refresh-token endpoint returns the same payload as the OTP-verify step of the
 * login flow, so on a successful refresh the entire session is updated identically to
 * how Login.jsx handles a successful VerifyOtpRequest response:
 *
 *   store.set(auth,         encodeString(accessToken))
 *   store.set(loginInfo,    encodeString(JSON.stringify(user)))
 *   store.set(refreshToken, encodeString(refreshToken))   ← always persisted
 *
 * On FAILURE the session atoms are cleared — Screens.jsx watches the auth atom and
 * redirects to login automatically without a hard page reload.
 *
 * Deduplication: `isRefreshing` gates concurrent 401 events within a single page load.
 * It is always reset in a `finally` block so the next permission change can trigger
 * a fresh refresh cycle without needing a page reload.
 */

import { getDefaultStore } from 'jotai';

import auth from '../atoms/auth.atom';
import loginInfo from '../atoms/loginInfo.atom';
import refreshTokenAtom from '../atoms/refreshToken.atom';
import { encodeString, decodeString } from '../utils';
import { getApiUrl, defaultHeaders } from './api.config';

let isRefreshing = false;

const clearSession = (store) => {
  store.set(auth, null);
  store.set(loginInfo, null);
  store.set(refreshTokenAtom, null);
  // Clearing the auth atom is enough — Screens.jsx watches it and redirects to login.
};

const handlePermissionsUpdated = async () => {
  if (isRefreshing) return;
  isRefreshing = true;

  const store = getDefaultStore();

  try {
    const encodedToken = store.get(auth);

    if (!encodedToken) {
      clearSession(store);
      return;
    }

    const token = decodeString(encodedToken);

    // Include the refresh token in the body when available.
    // Sessions created before refresh-token persistence was added won't have it stored,
    // so we fall back to the Bearer-token-only path for backward compatibility.
    const encodedRefreshToken = store.get(refreshTokenAtom);
    const currentRefreshToken = encodedRefreshToken ? decodeString(encodedRefreshToken) : null;

    const res = await fetch(getApiUrl('/auth/refresh-token'), {
      method: 'POST',
      headers: { ...defaultHeaders, Authorization: `Bearer ${token}` },
      ...(currentRefreshToken && { body: JSON.stringify({ refreshToken: currentRefreshToken }) }),
    });

    if (res.ok) {
      const result = await res.json();
      const accessToken = result?.data?.accessToken;
      const newRefreshToken = result?.data?.refreshToken;
      const user = result?.data?.user;

      if (accessToken) {
        // Mirror the Login.jsx session-setting logic exactly so the entire session is
        // refreshed the same way as a fresh OTP verify.
        store.set(auth, encodeString(accessToken));
        store.set(loginInfo, encodeString(JSON.stringify(user)));

        // Always persist a refresh token so subsequent calls always have a body to send.
        // Prefer the rotated token returned by the server; fall back to the one that was
        // just used successfully (server doesn't always rotate on every refresh).
        const tokenToPersist = newRefreshToken || currentRefreshToken;
        if (tokenToPersist) {
          store.set(refreshTokenAtom, encodeString(tokenToPersist));
        }

        // Atom updates above are enough — React re-renders with the new token automatically.
        return;
      }
    }

    // Refresh endpoint returned an error or no access token — clear the session to
    // avoid an infinite reload loop.
    console.error('[Permissions Middleware] Refresh failed — clearing session.', res.status);
    clearSession(store);
  } catch (err) {
    console.error('[Permissions Middleware] Token refresh threw an exception:', err);
    clearSession(store);
  } finally {
    // Always reset the guard so the next permission change is never silently dropped.
    isRefreshing = false;
  }
};

/**
 * Registers the "permissions:updated" event listener on the window object.
 * Call once at application startup (e.g. main.jsx) before the React tree mounts.
 */
export const initPermissionsMiddleware = () => {
  window.addEventListener('permissions:updated', handlePermissionsUpdated);
};
