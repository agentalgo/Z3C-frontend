import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const CustomerProfileTemplatesListRequest = (token) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/customer-profiles/templates`), {
        method: 'GET',
        headers: headers,
    })
        .then(async (res) => {
            if (!res.ok) {
                await handleNetworkError(res, 'Failed to get customer profile templates');
                const err = new Error('Failed to get customer profile templates');
                err[HANDLED_RESPONSE_ERROR] = true;
                throw err;
            }
            return res.json();
        })
        .catch((err) => {
            if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Customer profile templates list request failed');
            throw err;
        });
};

export default CustomerProfileTemplatesListRequest;
