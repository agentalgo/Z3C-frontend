import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

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
        .then((res) => {
            if (!res.ok) {
                handleNetworkError(res, 'Failed to update company profile');
                throw new Error('Failed to update company profile');
            }
            return res.json();
        })
        .catch((err) => {
            handleNetworkError(err, 'Company profile update request failed');
            throw err;
        });
};

export default CompanyProfileUpdateRequest;
