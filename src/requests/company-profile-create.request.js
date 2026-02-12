import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

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
        .then((res) => {
            if (!res.ok) {
                handleNetworkError(res, 'Failed to create company profile');
                throw new Error('Failed to create company profile');
            }
            return res.json();
        })
        .catch((err) => {
            handleNetworkError(err, 'Company profile create request failed');
            throw err;
        });
};

export default CompanyProfileCreateRequest;
