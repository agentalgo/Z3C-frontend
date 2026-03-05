import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const CustomerProfileDetailRequest = (token, profileId) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/customer-profiles/${profileId}`), {
        method: 'GET',
        headers: headers,
    })
        .then(async (res) => {
            if (!res.ok) {
                await handleNetworkError(res, 'Failed to get customer profile details');
                const err = new Error('Failed to get customer profile details');
                err[HANDLED_RESPONSE_ERROR] = true;
                throw err;
            }
            return res.json();
        })
        .catch((err) => {
            if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Customer profile details request failed');
            throw err;
        });
};

export default CustomerProfileDetailRequest;
