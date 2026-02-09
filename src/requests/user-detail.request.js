import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const UserDetailRequest = (token, userId) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/users/${userId}`), {
        method: 'GET',
        headers: headers,
    })
        .then((res) => {
            if (!res.ok) {
                handleNetworkError(res, 'Failed to get user details');
                throw new Error('Failed to get user details');
            }
            return res.json();
        })
        .catch((err) => {
            handleNetworkError(err, 'User details request failed');
            throw err;
        });
};

export default UserDetailRequest;
