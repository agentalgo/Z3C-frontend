// Packages
import toast, { toastConfig } from 'react-simple-toasts';
import 'react-simple-toasts/dist/style.css';
import 'react-simple-toasts/dist/theme/dark.css';
import CryptoJS from "crypto-js";

// Constants
import { TOAST_TYPES, ENCODER } from './constants';

// Toast Configuration
toastConfig({
  position: 'top-right',
  duration: 3500,
  clickClosable: true,
  maxVisibleToasts: 3,
  className: 'toast-custom',
});

// Toast Helper Function
export const showToast = (message, type = 'info', options = {}) => {
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;

  return toast(message, {
    ...options,
    render: (msg) => (
      <div className={`flex items-center gap-3 px-4 py-3 ${config.bgColor} border ${config.borderColor} rounded-lg shadow-lg text-sm text-[#0d121b] dark:text-white`}>
        <span className={`material-symbols-outlined text-[20px] ${config.iconColor}`}>
          {config.icon}
        </span>
        <span>{msg}</span>
      </div>
    ),
  });
};

export const encodeString = (val, encoder = null) => {
  const encodedWith = encoder || ENCODER;
  const ciphertext = CryptoJS.AES.encrypt(val, encodedWith).toString();
  return ciphertext;
};

export const decodeString = (val, encoder = null) => {
  const decodedWith = encoder || ENCODER;
  const bytes = CryptoJS.AES.decrypt(val, decodedWith);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
};

// Safely parse and normalize login info stored in the `loginInfo` atom.
// Supports both the legacy `{ user: { ... } }` envelope and a direct user object.
export const parseLoginInfo = (loginInfoValue) => {
  if (!loginInfoValue) return null;

  try {
    const parsed = JSON.parse(decodeString(loginInfoValue));
    if (!parsed) return null;

    const user = parsed.user && typeof parsed.user === 'object' ? parsed.user : parsed;
    return user && typeof user === 'object' ? user : null;
  } catch (error) {
    console.error('Failed to parse login info:', error);
    return null;
  }
};

// Normalize CRUD permissions for a specific module.
// If a permissions object is not present for a module (e.g. `user: null`),
// the user has no rights for that module.
export const getNormalizedModulePermissions = (user, moduleKey) => {
  if (!user || !moduleKey) {
    return { create: false, read: false, update: false, delete: false };
  }

  // An admin has full access everywhere, regardless of the per-module matrix.
  // Without this, an admin whose stored permissions carried unchecked modules
  // (anyone created or edited through the user-management form) had those
  // sections hidden from the sidebar and blocked in the routes even though the
  // backend grants admins everything. Mirrors PermissionGuard on the API side.
  if (user.isAdmin === true) {
    return { create: true, read: true, update: true, delete: true };
  }

  const allPermissions = user.permissions;

  // If the backend doesn't send a permissions object at all,
  // treat it as "no module-level restrictions".
  if (!allPermissions || typeof allPermissions !== 'object') {
    return { create: true, read: true, update: true, delete: true };
  }

  const modulePermissionsRaw = allPermissions[moduleKey];

  // Explicit `null` (or non-object) means "no access" for that module.
  if (modulePermissionsRaw == null || typeof modulePermissionsRaw !== 'object') {
    return { create: false, read: false, update: false, delete: false };
  }

  const modulePermissions = modulePermissionsRaw;

  return {
    create: modulePermissions.create === true,
    read: modulePermissions.read === true,
    update: modulePermissions.update === true,
    delete: modulePermissions.delete === true,
  };
};

// Convenience helper to check a single CRUD action for a module.
export const hasModulePermission = (user, moduleKey, action) => {
  const normalized = getNormalizedModulePermissions(user, moduleKey);
  if (!['create', 'read', 'update', 'delete'].includes(action)) return true;
  return Boolean(normalized[action]);
};
// ── Date formatting ─────────────────────────────────────────────────────────
//
// The API returns timestamps as UTC ISO-8601 strings (MongoDB stores BSON Date,
// which is always UTC), e.g. "2026-08-27T17:37:20.893Z". Showing that raw in a
// table is unreadable and, worse, misleading: a reader in Riyadh or Karachi
// naturally reads the digits as local wall-clock time when they are three or five
// hours behind it.
//
// These helpers render in the VIEWER's timezone. The local `getFullYear` /
// `getHours` family is used rather than Intl with a locale, because the requested
// output is a fixed ISO-like shape (YYYY-MM-DD HH:mm:ss) and locale formatting
// would reorder the parts per locale — `en-GB` yields day-first, `en-US`
// month-first. The Date object has already converted the instant to local time, so
// these getters ARE the timezone conversion; nothing else is needed.

const pad2 = (n) => String(n).padStart(2, '0');

const toDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * UTC timestamp -> "YYYY-MM-DD HH:mm:ss" in the viewer's local timezone.
 * Returns the placeholder for empty values, and the raw input unchanged if it is
 * not a parseable date — never "Invalid Date", which tells the reader nothing.
 */
export const formatDateTime = (value, placeholder = '—') => {
  const d = toDate(value);
  if (!d) return value === null || value === undefined || value === '' ? placeholder : String(value);
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
  );
};

/** Date only — "YYYY-MM-DD" in the viewer's local timezone. */
export const formatDateOnly = (value, placeholder = '—') => {
  const d = toDate(value);
  if (!d) return value === null || value === undefined || value === '' ? placeholder : String(value);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/**
 * The same instant spelled out in UTC plus the viewer's offset, for a `title`
 * tooltip. Because the table now shows local time, anyone comparing the UI against
 * a server log — which is in UTC — needs a way to see the original without
 * doing arithmetic in their head.
 */
export const formatDateTimeTooltip = (value) => {
  const d = toDate(value);
  if (!d) return '';
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const zone = `UTC${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
  return `${formatDateTime(value)} (${zone})\nUTC: ${d.toISOString().replace('T', ' ').replace('Z', '')} (UTC+00:00)`;
};
