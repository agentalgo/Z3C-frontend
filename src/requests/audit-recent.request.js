import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

/**
 * GET /api/v1/audit/recent — recent activity (permission: logs:read).
 * Query params: limit (1–100, default 20), userId (optional).
 * @param {string} token - JWT
 * @param {Object} params - { limit?: number, userId?: string }
 * @returns {Promise<Array>}
 */
const AuditRecentRequest = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit != null) queryParams.append('limit', params.limit);
  if (params.userId) queryParams.append('userId', params.userId);

  const queryString = queryParams.toString();
  const url = getApiUrl(`/audit/recent${queryString ? `?${queryString}` : ''}`);

  const headers = {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      await handleNetworkError(res, 'Failed to fetch recent activity');
      const err = new Error('Failed to fetch recent activity');
      err[HANDLED_RESPONSE_ERROR] = true;
      throw err;
    }

    return await res.json();
  } catch (err) {
    if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Audit recent request failed');
    throw err;
  }
};

export default AuditRecentRequest;
