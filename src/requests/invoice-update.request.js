import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const InvoiceUpdateRequest = (token, invoiceId, jsonData) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/invoices/${invoiceId}`), {
        method: 'PATCH',
        headers: headers,
        body: jsonData
    })
        .then((res) => {
            if (!res.ok) {
                handleNetworkError(res, 'Failed to update invoice');
                throw new Error('Failed to update invoice');
            }
            return res.json();
        })
        .catch((err) => {
            handleNetworkError(err, 'Invoice update request failed');
            throw err;
        });
};

export default InvoiceUpdateRequest;
