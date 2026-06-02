import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const NotificationRecipientUpdateRequest = (token, id, jsonData) => {
  const headers = {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };

  return fetch(getApiUrl(`/notification-recipients/${id}`), {
    method: 'PATCH',
    headers,
    body: jsonData,
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Failed to update notification recipient');
        const err = new Error('Failed to update notification recipient');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Notification recipient update request failed');
      throw err;
    });
};

export default NotificationRecipientUpdateRequest;
