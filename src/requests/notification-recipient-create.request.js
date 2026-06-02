import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const NotificationRecipientCreateRequest = (token, jsonData) => {
  const headers = {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };

  return fetch(getApiUrl('/notification-recipients'), {
    method: 'POST',
    headers,
    body: jsonData,
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Failed to create notification recipient');
        const err = new Error('Failed to create notification recipient');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Notification recipient create request failed');
      throw err;
    });
};

export default NotificationRecipientCreateRequest;
