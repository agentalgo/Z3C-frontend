import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const UserCreateRequest = (token, jsonData) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl('/users'), {
        method: 'POST',
        headers: headers,
        body: jsonData
    })
        .then(async (res) => {
            if (!res.ok) {
                await handleNetworkError(res, 'Failed to create user');
                const err = new Error('Failed to create user');
                err[HANDLED_RESPONSE_ERROR] = true;
                throw err;
            }
            return res.json();
        })
        .catch((err) => {
            if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'User create request failed');
            throw err;
        });
};

export default UserCreateRequest;
