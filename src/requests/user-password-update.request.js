import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

/**
 * Sets a user's password via `PATCH /users/:id/password`.
 *
 * Passwords are deliberately NOT accepted by `PATCH /users/:id`: that route is
 * behind SelfOrAdminGuard, so any signed-in user may PATCH their own record, and
 * accepting a password there would let anyone holding a live session change the
 * password without proving they know the current one. This dedicated route
 * enforces the real rule instead — a self-service change requires
 * `currentPassword`, while an administrator resetting somebody else's does not.
 *
 * @param {string} token    caller's access token
 * @param {string} id       user being updated
 * @param {string} jsonData JSON body: { newPassword, currentPassword? }
 */
const UserPasswordUpdateRequest = async (token, id, jsonData) => {
  const headers = {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(getApiUrl(`/users/${id}/password`), {
      method: 'PATCH',
      headers,
      body: jsonData,
    });

    if (!res.ok) {
      await handleNetworkError(res, 'Failed to update password');
      const err = new Error('Failed to update password');
      err[HANDLED_RESPONSE_ERROR] = true;
      throw err;
    }

    return await res.json();
  } catch (err) {
    if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Password update request failed');
    throw err;
  }
};

export default UserPasswordUpdateRequest;
