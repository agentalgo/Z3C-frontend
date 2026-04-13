import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const RefreshTokenRequest = (token, jsonData) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl('/auth/refresh-token'), {
        method: 'POST',
        headers: headers,
        body: jsonData
    })
        .then(async (res) => {
            if (!res.ok) {
                await handleNetworkError(res, 'Failed to refresh token');
                const err = new Error('Failed to refresh token');
                err[HANDLED_RESPONSE_ERROR] = true;
                throw err;
            }
            return res.json();
        })
        .catch((err) => {
            if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Refresh token request failed');
            throw err;
        });
};

export default RefreshTokenRequest;
