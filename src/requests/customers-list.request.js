import { getApiUrl, defaultHeaders, handleNetworkError } from './api.config';

const CustomersListRequest = () => {
  return fetch(getApiUrl('/customers'), {
    method: 'GET',
    headers: defaultHeaders,
  })
    .then((res) => {
      if (!res.ok) {
        handleNetworkError(res, 'Failed to fetch customers');
        throw new Error('Failed to fetch customers');
      }
      return res.json();
    })
    .catch((err) => {
      handleNetworkError(err, 'Customers list request failed');
      throw err;
    });
};

export default CustomersListRequest;
