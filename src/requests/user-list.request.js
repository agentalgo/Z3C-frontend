import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const UserListRequest = () => {
  return fetch(getApiUrl('/users'), {
    method: 'GET',
    headers: defaultHeaders,
  })
    .then((res) => {
      if (!res.ok) {
        handleNetworkError(res, 'Failed to fetch users');
        throw new Error('Failed to fetch users');
      }
      return res.json();
    })
    .catch((err) => {
      handleNetworkError(err, 'Users list request failed');
      throw err;
    });
};

export default UserListRequest;
