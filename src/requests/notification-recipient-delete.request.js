import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const NotificationRecipientDeleteRequest = (token, id) => {
  const headers = {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };

  return fetch(getApiUrl(`/notification-recipients/${id}`), {
    method: 'DELETE',
    headers,
  })
    .then(async (res) => {
      if (!res.ok) {
        await handleNetworkError(res, 'Failed to delete notification recipient');
        const err = new Error('Failed to delete notification recipient');
        err[HANDLED_RESPONSE_ERROR] = true;
        throw err;
      }
      return res.json();
    })
    .catch((err) => {
      if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Notification recipient delete request failed');
      throw err;
    });
};

export default NotificationRecipientDeleteRequest;
