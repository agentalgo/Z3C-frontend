import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const CustomerDetailRequest = (token, customerId) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  return fetch(getApiUrl(`/customers/${customerId}`), {
    method: 'GET',
    headers: headers,
  })
    .then((res) => {
      if (!res.ok) {
        handleNetworkError(res, 'Failed to get customer');
        throw new Error('Failed to get customer');
      }
      return res.json();
    })
    .catch((err) => {
      handleNetworkError(err, 'Customer get request failed');
      throw err;
    });
};

export default CustomerDetailRequest;
