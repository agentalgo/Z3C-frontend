import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const ZatcaReportDownloadRequest = (token, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.fromDate) queryParams.append('fromDate', params.fromDate);
  if (params.toDate) queryParams.append('toDate', params.toDate);
  if (params.zatcaStatus) queryParams.append('zatcaStatus', params.zatcaStatus);

  const queryString = queryParams.toString();
  const url = getApiUrl(`/reports/invoices/excel${queryString ? `?${queryString}` : ''}`);

  const { ['Content-Type']: _ignoredContentType, ...restDefaultHeaders } = defaultHeaders || {};

  const headers = {
    ...restDefaultHeaders,
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/octet-stream',
  };

  return fetch(url, {
    method: 'GET',
    headers,
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Failed to download ZATCA report');
        const err = new Error('Failed to download ZATCA report');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }

      // Return the raw Excel blob to be handled by the caller
      return res.blob();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'ZATCA report download request failed');
      throw err;
    });
};

export default ZatcaReportDownloadRequest;
