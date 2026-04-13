import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const CustomerProfileDeleteRequest = (token, profileId) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  return fetch(getApiUrl(`/customer-profiles/${profileId}`), { 
    method: 'DELETE',
    headers: headers,
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Failed to delete customer profile');
        const err = new Error('Failed to delete customer profile');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Customer profile delete request failed');
      throw err;
    });
};

export default CustomerProfileDeleteRequest;
