import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

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
    .then((res) => {
      if (!res.ok) {
        handleNetworkError(res, 'Failed to create invoice');
        throw new Error('Failed to create invoice');
      }
      return res.json();
    })
    .catch((err) => {
      handleNetworkError(err, 'Invoice create request failed');
      throw err;
    });
};

export default InvoiceCreateRequest;
