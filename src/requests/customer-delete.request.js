import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const CustomerDeleteRequest = (token, customerId) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  return fetch(getApiUrl(`/customers/${customerId}`), { 
    method: 'DELETE',
    headers: headers,
  })
    .then((res) => {
      if (!res.ok) {
        handleNetworkError(res, 'Failed to delete customer');
        throw new Error('Failed to delete customer');
      }
      return res.json();
    })
    .catch((err) => {
      handleNetworkError(err, 'Customer delete request failed');
      throw err;
    });
};

export default CustomerDeleteRequest;
