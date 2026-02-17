import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const InvoiceDeleteRequest = (token, invoiceId) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  return fetch(getApiUrl(`/invoices/${invoiceId}`), { 
    method: 'DELETE',
    headers: headers,
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Failed to delete invoice');
        const err = new Error('Failed to delete invoice');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Invoice get request failed');
      throw err;
    });
};

export default InvoiceDeleteRequest;
