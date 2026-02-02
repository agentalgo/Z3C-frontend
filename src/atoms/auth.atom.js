import { atomWithStorage } from 'jotai/utils';

const auth = atomWithStorage('auth', '');

export default auth;