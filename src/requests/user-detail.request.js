import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const UserDetailRequest = (token, userId) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/users/${userId}`), {
        method: 'GET',
        headers: headers,
    })
        .then(async (res) => {
            if (!res.ok) {
                await handleNetworkError(res, 'Failed to get user details');
                const err = new Error('Failed to get user details');
                err[HANDLED_RESPONSE_ERROR] = true;
                throw err;
            }
            return res.json();
        })
        .catch((err) => {
            if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'User details request failed');
            throw err;
        });
};

export default UserDetailRequest;
