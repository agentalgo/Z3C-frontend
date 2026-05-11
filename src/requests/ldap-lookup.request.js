import { getApiUrl, defaultHeaders, HANDLED_RESPONSE_ERROR } from './api.config';

/**
 * Look up an AD user by sAMAccountName (read-only preview before provisioning).
 * Returns { sAMAccountName, email, displayName, memberOf, resolvedRole, alreadyProvisioned }.
 * Throws with a user-friendly message on 404 (not found in AD) or other errors.
 */
const LdapLookupRequest = (token, sAMAccountName) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`,
    };
    const url = getApiUrl(`/auth/ldap/lookup?sAMAccountName=${encodeURIComponent(sAMAccountName)}`);
    return fetch(url, { method: 'GET', headers })
        .then(async (res) => {
            if (res.status === 404) {
                const err = new Error(`"${sAMAccountName}" was not found in Active Directory`);
                err[HANDLED_RESPONSE_ERROR] = true;
                throw err;
            }
            if (!res.ok) {
                let msg = 'AD lookup failed';
                try {
                    const data = await res.clone().json();
                    if (data?.message) msg = data.message;
                } catch (_) { /* ignore */ }
                const err = new Error(msg);
                err[HANDLED_RESPONSE_ERROR] = true;
                throw err;
            }
            return res.json();
        });
};

export default LdapLookupRequest;
