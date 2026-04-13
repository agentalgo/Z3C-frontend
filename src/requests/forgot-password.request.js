import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const ForgotPasswordRequest = (data) => {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  return fetch(getApiUrl('/auth/forgot-password'), {
    method: 'POST',
    headers: defaultHeaders,
    body,
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Request failed');
        const err = new Error('Request failed');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Request failed');
      throw err;
    });
};

export default ForgotPasswordRequest;
