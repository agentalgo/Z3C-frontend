import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const InvoiceListRequest = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.status) queryParams.append('status', params.status);
  if (params.invoiceType) queryParams.append('invoiceType', params.invoiceType);
  if (params.paymentType) queryParams.append('paymentType', params.paymentType);
  if (params.fromDate) queryParams.append('fromDate', params.fromDate);
  if (params.toDate) queryParams.append('toDate', params.toDate);

  const queryString = queryParams.toString();
  const url = getApiUrl(`/invoices${queryString ? `?${queryString}` : ''}`);

  const headers = {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
    if (!res.ok) {
      await handleNetworkError(res, 'Failed to fetch invoices');
      const err = new Error('Failed to fetch invoices');
      err[HANDLED_RESPONSE_ERROR] = true;
      throw err;
    }
    return await res.json();
  } catch (err) {
    if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Invoices list request failed');
    throw err;
  }
};

export default InvoiceListRequest;
