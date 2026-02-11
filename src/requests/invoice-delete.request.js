import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const InvoiceDeleteRequest = (token, invoiceId) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  return fetch(getApiUrl(`/invoices/${invoiceId}`), { 
    method: 'DELETE',
    headers: headers,
  })
    .then((res) => {
      if (!res.ok) {
        handleNetworkError(res, 'Failed to delete invoice');
        throw new Error('Failed to delete invoice');
      }
      return res.json();
    })
    .catch((err) => {
      handleNetworkError(err, 'Invoice get request failed');
      throw err;
    });
};

export default InvoiceDeleteRequest;
