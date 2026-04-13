import { atomWithStorage } from 'jotai/utils';

// Stores the encrypted refresh token received after OTP verification.
// `null` means no active session.
const refreshToken = atomWithStorage('refreshToken', null);

export default refreshToken;
