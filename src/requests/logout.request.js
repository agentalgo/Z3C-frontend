import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const LogoutRequest = (token) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  return fetch(getApiUrl('/auth/logout'), {
    method: 'POST',
    headers: headers
  })
    .then((res) => {
      if (!res.ok) {
        handleNetworkError(res, 'Logout request failed');
        throw new Error('Logout request failed');
      }
      return res.json();
    })
    .catch((err) => {
      handleNetworkError(err, 'Logout request failed');
      throw err;
    });
};

export default LogoutRequest;
