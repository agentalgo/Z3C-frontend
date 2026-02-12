import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const InvoiceSubmitToZatcaRequest = (token, invoiceId) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/invoices/${invoiceId}/submit`), {
        method: 'POST',
        headers: headers,
    })
        .then((res) => {
            if (!res.ok) {
                handleNetworkError(res, 'Failed to submit invoice to ZATCA');
                throw new Error('Failed to submit invoice to ZATCA');
            }
            return res.json();
        })
        .catch((err) => {
            handleNetworkError(err, 'Invoice submit to ZATCA request failed');
            throw err;
        });
};

export default InvoiceSubmitToZatcaRequest;
