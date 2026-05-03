import { atom } from 'jotai';

// Flag to prevent multiple concurrent token refresh attempts
const isRefreshingToken = atom(false);

export default isRefreshingToken;
