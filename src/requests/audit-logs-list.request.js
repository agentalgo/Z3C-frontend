import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

/**
 * Fetches paginated audit logs from GET /api/v1/audit (AuditController_findAll).
 * Query params: userId, entityType, entityId, action, fromDate, toDate, page, limit, search, sortBy, sortOrder.
 * Response: { items, total, page, limit, totalPages } (and possibly success/data wrapper).
 */
const AuditLogsListRequest = async (token, params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.userId) queryParams.append('userId', params.userId);
  if (params.entityType) queryParams.append('entityType', params.entityType);
  if (params.entityId) queryParams.append('entityId', params.entityId);
  if (params.action) queryParams.append('action', params.action);
  if (params.fromDate) queryParams.append('fromDate', params.fromDate);
  if (params.toDate) queryParams.append('toDate', params.toDate);
  if (params.page != null) queryParams.append('page', params.page);
  if (params.limit != null) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const url = getApiUrl(`/audit${queryString ? `?${queryString}` : ''}`);

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
      await handleNetworkError(res, 'Failed to fetch audit logs');
      const err = new Error('Failed to fetch audit logs');
      err[HANDLED_RESPONSE_ERROR] = true;
      throw err;
    }
    return await res.json();
  } catch (err) {
    if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Audit logs list request failed');
    throw err;
  }
};

export default AuditLogsListRequest;
