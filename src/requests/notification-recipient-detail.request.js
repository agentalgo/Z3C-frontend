import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const NotificationRecipientDetailRequest = async (token, id) => {
  const headers = {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(getApiUrl(`/notification-recipients/${id}`), { method: 'GET', headers });

    if (!res.ok) {
      await handleNetworkError(res, 'Failed to fetch notification recipient');
      const err = new Error('Failed to fetch notification recipient');
      err[HANDLED_RESPONSE_ERROR] = true;
      throw err;
    }

    return await res.json();
  } catch (err) {
    if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Notification recipient detail request failed');
    throw err;
  }
};

export default NotificationRecipientDetailRequest;
