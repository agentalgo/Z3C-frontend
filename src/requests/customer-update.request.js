import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const CustomerUpdateRequest = (token, customerId, jsonData) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/customers/${customerId}`), {
        method: 'PATCH',
        headers: headers,
        body: jsonData
    })
        .then((res) => {
            if (!res.ok) {
                handleNetworkError(res, 'Failed to update customer');
                throw new Error('Failed to update customer');
            }
            return res.json();
        })
        .catch((err) => {
            handleNetworkError(err, 'Customer update request failed');
            throw err;
        });
};

export default CustomerUpdateRequest;
