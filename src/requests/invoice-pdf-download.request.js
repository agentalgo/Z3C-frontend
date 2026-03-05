import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const InvoicePdfDownloadRequest = (token, invoiceId) => {
  // Remove any JSON-specific content type and request the response as PDF
  const { ['Content-Type']: _ignoredContentType, ...restDefaultHeaders } = defaultHeaders || {};

  const headers = {
    ...restDefaultHeaders,
    Authorization: `Bearer ${token}`,
    Accept: 'application/pdf',
  };

  return fetch(getApiUrl(`/invoices/${invoiceId}/pdf`), {
    method: 'GET',
    headers,
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Failed to download invoice PDF');
        const err = new Error('Failed to download invoice PDF');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }

      // Return the raw PDF blob to be handled by the caller
      return res.blob();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Invoice PDF download request failed');
      throw err;
    });
};

export default InvoicePdfDownloadRequest;
