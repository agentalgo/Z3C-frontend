// Packages
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSetAtom } from 'jotai';

// Utils
import { encodeString, showToast } from '../../../utils';
import { getApiUrl, defaultHeaders } from '../../../requests/api.config';
import { auth, loginInfo, refreshToken } from '../../../atoms';

function AzureOidcComplete() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useSetAtom(auth);
  const setLoginInfo = useSetAtom(loginInfo);
  const setRefreshToken = useSetAtom(refreshToken);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const accessToken = searchParams.get('accessToken');
    const newRefreshToken = searchParams.get('refreshToken');

    if (!accessToken) {
      navigate('/login?error=missing_token', { replace: true });
      return;
    }

    fetch(getApiUrl('/auth/profile'), {
      method: 'GET',
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then((data) => {
        const user = data?.user ?? data;
        setAuth(encodeString(accessToken));
        if (newRefreshToken) setRefreshToken(encodeString(newRefreshToken));
        setLoginInfo(encodeString(JSON.stringify(user)));
        showToast('Signed in with Microsoft', 'success');
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        navigate('/login?error=azure_login_failed', { replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] dark:bg-[#0f1323]">
      <span className="text-sm text-slate-600 dark:text-slate-300">
        Completing sign-in...
      </span>
    </div>
  );
}

export default AzureOidcComplete;
