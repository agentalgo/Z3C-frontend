import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

/**
 * GET /api/v1/dashboard/kpi-stats — KPI summary stats (permission: invoice:read).
 * @param {string} token - JWT
 * @param {Object} params - { from?: string (YYYY-MM-DD), to?: string (YYYY-MM-DD) }
 * @returns {Promise<Object>}
 */
const DashboardKpiStatsRequest = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.from) queryParams.append('from', params.from);
  if (params.to) queryParams.append('to', params.to);

  const queryString = queryParams.toString();
  const url = getApiUrl(`/dashboard/kpi-stats${queryString ? `?${queryString}` : ''}`);

  const headers = {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(url, { method: 'GET', headers });

    if (!res.ok) {
      await handleNetworkError(res, 'Failed to fetch KPI stats');
      const err = new Error('Failed to fetch KPI stats');
      err[HANDLED_RESPONSE_ERROR] = true;
      throw err;
    }

    return await res.json();
  } catch (err) {
    if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Dashboard KPI stats request failed');
    throw err;
  }
};

export default DashboardKpiStatsRequest;
