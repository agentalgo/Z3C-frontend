import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const InvoiceCreateDebitNoteRequest = (token, invoiceId, jsonData) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  return fetch(getApiUrl(`/invoices/${invoiceId}/debit-note`), {
    method: 'POST',
    headers: headers,
    body: jsonData
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Failed to create debit note');
        const err = new Error('Failed to create debit note');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Invoice create debit note request failed');
      throw err;
    });
};

export default InvoiceCreateDebitNoteRequest;
