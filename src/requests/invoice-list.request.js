import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const InvoiceListRequest = () => {
  return fetch(getApiUrl('/invoices'), {
    method: 'GET',
    headers: defaultHeaders,
  })
    .then((res) => {
      if (!res.ok) {
        handleNetworkError(res, 'Failed to fetch invoices');
        throw new Error('Failed to fetch invoices');
      }
      return res.json();
    })
    .catch((err) => {
      handleNetworkError(err, 'Invoices list request failed');
      throw err;
    });
};

export default InvoiceListRequest;
