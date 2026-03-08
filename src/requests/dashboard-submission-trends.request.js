import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

/**
 * GET /api/v1/dashboard/submission-trends — daily submission trend data (permission: invoice:read).
 * @param {string} token - JWT
 * @param {Object} params - { from?: string (YYYY-MM-DD), to?: string (YYYY-MM-DD) }
 * @returns {Promise<Array>}
 */
const DashboardSubmissionTrendsRequest = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.from) queryParams.append('from', params.from);
  if (params.to) queryParams.append('to', params.to);

  const queryString = queryParams.toString();
  const url = getApiUrl(`/dashboard/submission-trends${queryString ? `?${queryString}` : ''}`);

  const headers = {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(url, { method: 'GET', headers });

    if (!res.ok) {
      await handleNetworkError(res, 'Failed to fetch submission trends');
      const err = new Error('Failed to fetch submission trends');
      err[HANDLED_RESPONSE_ERROR] = true;
      throw err;
    }

    return await res.json();
  } catch (err) {
    if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Dashboard submission trends request failed');
    throw err;
  }
};

export default DashboardSubmissionTrendsRequest;
