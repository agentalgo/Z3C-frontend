import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const CustomerCreateRequest = (token, jsonData) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  return fetch(getApiUrl('/customers'), {
    method: 'POST',
    headers: headers,
    body: jsonData
  })
    .then((res) => {
      if (!res.ok) {
        handleNetworkError(res, 'Failed to create customer');
        throw new Error('Failed to create customer');
      }
      return res.json();
    })
    .catch((err) => {
      handleNetworkError(err, 'Customer create request failed');
      throw err;
    });
};

export default CustomerCreateRequest;
