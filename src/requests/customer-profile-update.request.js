import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const CustomerProfileUpdateRequest = (token, profileId, jsonData) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/customer-profiles/${profileId}`), {
        method: 'PATCH',
        headers: headers,
        body: jsonData
    })
        .then(async (res) => {
            if (!res.ok) {
                await handleNetworkError(res, 'Failed to update customer profile');
                const err = new Error('Failed to update customer profile');
                err[HANDLED_RESPONSE_ERROR] = true;
                throw err;
            }
            return res.json();
        })
        .catch((err) => {
            if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Customer profile update request failed');
            throw err;
        });
};

export default CustomerProfileUpdateRequest;
