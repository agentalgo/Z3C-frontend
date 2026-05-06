import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const LdapLoginRequest = (data) => {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  return fetch(getApiUrl('/auth/ldap/login'), {
    method: 'POST',
    headers: defaultHeaders,
    body,
  })
    .then(async (res) => {
      if (res.status === 403) {
        const err = new Error('Your account is pending administrator approval');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      if (!res.ok) {
        await handleNetworkError(res, 'Invalid username or password');
        const err = new Error('Invalid username or password');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'LDAP login request failed');
      throw err;
    });
};

export default LdapLoginRequest;
