import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const LoginRequest = (data) => {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  return fetch(getApiUrl('/auth/login'), {
    method: 'POST',
    headers: defaultHeaders,
    body,
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Invalid email or password');
        const err = new Error('Invalid email or password');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Login request failed');
      throw err;
    });
};

export default LoginRequest;
