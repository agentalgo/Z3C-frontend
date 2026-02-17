import { getApiUrl, defaultHeaders, handleNetworkError, HANDLED_RESPONSE_ERROR } from './api.config';

const CompanyProfileCreateRequest = (token, jsonData) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl('/company-profiles'), {
        method: 'POST',
        headers: headers,
        body: jsonData
    })
        .then(async (res) => {
            if (!res.ok) {
                await handleNetworkError(res, 'Failed to create company profile');
                const err = new Error('Failed to create company profile');
                err[HANDLED_RESPONSE_ERROR] = true;
                throw err;
            }
            return res.json();
        })
        .catch((err) => {
            if (!err?.[HANDLED_RESPONSE_ERROR]) handleNetworkError(err, 'Company profile create request failed');
            throw err;
        });
};

export default CompanyProfileCreateRequest;
