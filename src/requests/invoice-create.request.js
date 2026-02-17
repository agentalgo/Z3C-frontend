import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const InvoiceCreateRequest = (token, jsonData) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  return fetch(getApiUrl('/invoices/excl-customer'), {
    method: 'POST',
    headers: headers,
    body: jsonData
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Failed to create invoice');
        const err = new Error('Failed to create invoice');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Invoice create request failed');
      throw err;
    });
};

export default InvoiceCreateRequest;
