import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const CompanyProfileUpdateRequest = (token, profileId, jsonData) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/company-profiles/${profileId}`), {
        method: 'PATCH',
        headers: headers,
        body: jsonData
    })
        .then(async (res) => {
            if (!res.ok) {
                await handleNetworkError(res, 'Failed to update company profile');
                const err = new Error('Failed to update company profile');
                err[HANDLED_RESPONSE_ERROR] = true;
                throw err;
            }
            return res.json();
        })
        .catch((err) => {
            if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Company profile update request failed');
            throw err;
        });
};

export default CompanyProfileUpdateRequest;
