import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const VerifyOtpRequest = (data) => {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  return fetch(getApiUrl('/auth/verify-otp'), {
    method: 'POST',
    headers: defaultHeaders,
    body,
  })
    .then((res) => {
      if (!res.ok) {
        handleNetworkError(res, 'Invalid OTP code');
        throw new Error('Invalid OTP code');
      }
      return res.json();
    })
    .catch((err) => {
      handleNetworkError(err, 'Login request failed');
      throw err;
    });
};

export default VerifyOtpRequest;
