import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const InvoiceDetailRequest = (token, invoiceId) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  return fetch(getApiUrl(`/invoices/${invoiceId}`), {
    method: 'GET',
    headers: headers,
  })
    .then((res) => {
      if (!res.ok) {
        handleNetworkError(res, 'Failed to get invoice');
        throw new Error('Failed to get invoice');
      }
      return res.json();
    })
    .catch((err) => {
      handleNetworkError(err, 'Invoice get request failed');
      throw err;
    });
};

export default InvoiceDetailRequest;
