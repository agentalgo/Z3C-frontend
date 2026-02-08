import { BASE_URL, showToast } from '../utils';

/**
 * Default headers for all API requests.
 * Override or extend per request as needed.
 */
export const defaultHeaders = {
  'Content-Type': 'application/json',
};

/**
 * HTTP status code to user-facing error message.
 */
export const HTTP_ERROR_MESSAGES = {
  400: 'Bad request. Please check your input.',
  401: 'Unauthorized. Please sign in again.',
  402: 'Payment required.',
  403: 'Forbidden. You do not have access.',
  404: 'Not found. The requested resource does not exist.',
  408: 'Request timeout. Please try again.',
  409: 'Conflict. The request could not be completed.',
  422: 'Unprocessable. Please check your data.',
  429: 'Too many requests. Please try again later.',
  500: 'Server error. Please try again later.',
  502: 'Bad gateway. Service temporarily unavailable.',
  503: 'Service unavailable. Please try again later.',
  504: 'Gateway timeout. Please try again later.',
};

/**
 * Generic network error handler: shows an error toast and logs to console.
 * @param {Response|Error|unknown} errorOrResponse - Fetch Response (with status) or Error instance.
 * @param {string} [fallbackMessage] - Message to use when status/error message cannot be determined.
 */
export const handleNetworkError = (errorOrResponse, fallbackMessage = 'Something went wrong') => {
  let message = fallbackMessage;

  if (errorOrResponse?.status !== undefined) {
    // Fetch Response object
    const status = errorOrResponse.status;
    message = HTTP_ERROR_MESSAGES[status] ?? errorOrResponse.statusText ?? fallbackMessage;
  } else if (errorOrResponse?.message) {
    message = errorOrResponse.message;
  }

  showToast(message, 'error');
  console.error('[Network Error]', message, errorOrResponse);
};

/**
 * Builds the full API URL for a given path.
 * @param {string} path - API path (e.g. '/login'). Leading slash is optional.
 * @returns {string} Full URL
 */
export const getApiUrl = (path) => {
  const base = BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

export { BASE_URL };
