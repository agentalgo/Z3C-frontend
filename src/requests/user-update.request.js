import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const UserUpdateRequest = (token, userId, jsonData) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/users/${userId}`), {
        method: 'PATCH',
        headers: headers,
        body: jsonData
    })
        .then((res) => {
            if (!res.ok) {
                handleNetworkError(res, 'Failed to update user');
                throw new Error('Failed to update user');
            }
            return res.json();
        })
        .catch((err) => {
            handleNetworkError(err, 'User update request failed');
            throw err;
        });
};

export default UserUpdateRequest;
