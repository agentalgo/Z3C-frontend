import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const InvoiceSubmitToZatcaRequest = (token, invoiceId) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/invoices/${invoiceId}/submit`), {
        method: 'POST',
        headers: headers,
    })
        .then(async (res) => {
            if (!res.ok) {
                await handleNetworkError(res, 'Failed to submit invoice to ZATCA');
                const err = new Error('Failed to submit invoice to ZATCA');
                err[HANDLED_RESPONSE_ERROR] = true;
                throw err;
            }
            return res.json();
        })
        .catch((err) => {
            if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Invoice submit to ZATCA request failed');
            throw err;
        });
};

export default InvoiceSubmitToZatcaRequest;
