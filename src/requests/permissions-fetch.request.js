import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const PermissionsFetchRequest = async (token) => {
  const url = getApiUrl(`/users/permission-resources`);

  const headers = {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
    if (!res.ok) {
      await handleNetworkError(res, 'Failed to fetch permissions');
      const err = new Error('Failed to fetch permissions');
      err[HANDLED_RESPONSE_ERROR] = true;
      throw err;
    }
    return await res.json();
  } catch (err) {
    if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Permissions fetch request failed');
    throw err;
  }
};

export default PermissionsFetchRequest;
