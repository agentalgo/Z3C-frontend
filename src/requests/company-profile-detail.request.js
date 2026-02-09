import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const CompanyProfileDetailRequest = (token, profileId) => {
    const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${token}`
    };
    return fetch(getApiUrl(`/company-profiles/${profileId}`), {
        method: 'GET',
        headers: headers,
    })
        .then((res) => {
            if (!res.ok) {
                handleNetworkError(res, 'Failed to get company profile details');
                throw new Error('Failed to get company profile details');
            }
            return res.json();
        })
        .catch((err) => {
            handleNetworkError(err, 'Company profile details request failed');
            throw err;
        });
};

export default CompanyProfileDetailRequest;
