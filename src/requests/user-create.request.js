import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

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
        .then((res) => {
            if (!res.ok) {
                handleNetworkError(res, 'Failed to create user');
                throw new Error('Failed to create user');
            }
            return res.json();
        })
        .catch((err) => {
            handleNetworkError(err, 'User create request failed');
            throw err;
        });
};

export default UserCreateRequest;
