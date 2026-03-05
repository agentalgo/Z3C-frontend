import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const InvoiceCheckComplianceRequest = (token, invoiceId, jsonData={}) => {
  const headers = {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
  return fetch(getApiUrl(`/invoices/${invoiceId}/queue-compliance`), {
    method: 'POST',
    headers: headers,
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Failed to check invoice compliance');
        const err = new Error('Failed to check invoice compliance');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Invoice check compliance request failed');
      throw err;
    });
};

export default InvoiceCheckComplianceRequest;
