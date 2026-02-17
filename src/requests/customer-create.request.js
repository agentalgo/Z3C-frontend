import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

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
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Failed to create customer');
        const err = new Error('Failed to create customer');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Customer create request failed');
      throw err;
    });
};

export default CustomerCreateRequest;
