import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const LdapLogoutRequest = (token) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`,
  };
  return fetch(getApiUrl('/auth/ldap/logout'), {
    method: 'POST',
    headers,
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'LDAP logout request failed');
        const err = new Error('LDAP logout request failed');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'LDAP logout request failed');
      throw err;
    });
};

export default LdapLogoutRequest;
