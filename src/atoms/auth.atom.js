import { atomWithStorage } from 'jotai/utils';

// `null` means "auth state not yet hydrated from storage"
// Any other truthy value means "authenticated"
const auth = atomWithStorage('auth', null);

export default auth;