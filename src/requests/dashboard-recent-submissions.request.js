import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

/**
 * GET /api/v1/dashboard/recent-submissions — latest invoice submissions (permission: invoice:read).
 * @param {string} token - JWT
 * @param {Object} params - { limit?: number (default 5) }
 * @returns {Promise<Array>}
 */
const DashboardRecentSubmissionsRequest = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit != null) queryParams.append('limit', params.limit);

  const queryString = queryParams.toString();
  const url = getApiUrl(`/dashboard/recent-submissions${queryString ? `?${queryString}` : ''}`);

  const headers = {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(url, { method: 'GET', headers });

    if (!res.ok) {
      await handleNetworkError(res, 'Failed to fetch recent submissions');
      const err = new Error('Failed to fetch recent submissions');
      err[HANDLED_RESPONSE_ERROR] = true;
      throw err;
    }

    return await res.json();
  } catch (err) {
    if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Dashboard recent submissions request failed');
    throw err;
  }
};

export default DashboardRecentSubmissionsRequest;
