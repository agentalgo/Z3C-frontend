import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const CompanyProfileDetailRequest = (token, profileId) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/company-profiles/${profileId}`), {
        method: 'GET',
        headers: headers,
    })
        .then(async (res) => {
            if (!res.ok) {
                await handleNetworkError(res, 'Failed to get company profile details');
                const err = new Error('Failed to get company profile details');
                err[HANDLED_RESPONSE_ERROR] = true;
                throw err;
            }
            return res.json();
        })
        .catch((err) => {
            if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Company profile details request failed');
            throw err;
        });
};

export default CompanyProfileDetailRequest;
