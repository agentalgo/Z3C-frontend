import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const LogoutRequest = (token) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  return fetch(getApiUrl('/auth/logout'), {
    method: 'POST',
    headers: headers
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Logout request failed');
        const err = new Error('Logout request failed');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Logout request failed');
      throw err;
    });
};

export default LogoutRequest;
