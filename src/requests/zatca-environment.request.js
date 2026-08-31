import { getApiUrl, defaultHeaders, HANDLED_RESPONSE_ERROR } from './api.config';

/**
 * Reads which ZATCA environment the backend is actually operating in.
 *
 * Returns { status, environment, onboardedEnvironment, onboarded, gatewayUrl }.
 * `environment` comes from ZATCA_ENV on the server — the variable that selects the
 * gateway URL — and `onboardedEnvironment` from the stored EGS onboarding, so a
 * disagreement between the two is visible rather than inferred.
 *
 * Deliberately does NOT call handleNetworkError: this powers a passive badge in the
 * header, so a failure here must stay silent. Routing it through the shared handler
 * would pop an error toast on every screen whenever the endpoint is unreachable —
 * and on a 401 it would join the token-refresh path, competing with the request the
 * user actually triggered. The badge simply renders nothing if this fails.
 */
const ZatcaEnvironmentRequest = async (token) => {
  const res = await fetch(getApiUrl('/zatca/environment'), {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = new Error(`Failed to read ZATCA environment (HTTP ${res.status})`);
    err[HANDLED_RESPONSE_ERROR] = true; // suppress any upstream toast
    err.status = res.status;
    throw err;
  }

  const body = await res.json();
  return body?.data ?? body;
};

export default ZatcaEnvironmentRequest;
