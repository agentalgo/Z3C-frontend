import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const CustomerListRequest = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);

  const queryString = queryParams.toString();
  const url = getApiUrl(`/customers${queryString ? `?${queryString}` : ''}`);

  const headers = {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
    if (!res.ok) {
      handleNetworkError(res, 'Failed to fetch customers');
      throw new Error('Failed to fetch customers');
    }
    return await res.json();
  } catch (err) {
    handleNetworkError(err, 'Customers list request failed');
    throw err;
  }
};

export default CustomerListRequest;
