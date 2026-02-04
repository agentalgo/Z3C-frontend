import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const LoginRequest = (data) => {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  return fetch(getApiUrl('/auth/login'), {
    method: 'POST',
    headers: defaultHeaders,
    body,
  })
    .then((res) => { 
      if (!res.ok) {
        handleNetworkError(res, 'Invalid email or password');
        throw new Error('Invalid email or password');
      }
      return res.json();
    })
    .catch((err) => {
      handleNetworkError(err, 'Login request failed');
      throw err;
    });
};

export default LoginRequest;
