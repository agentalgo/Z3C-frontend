// Packages
import { Fragment, useState, useEffect } from 'react';
import { useSetAtom } from 'jotai';

// Requests
import { LoginRequest } from '../../../requests';

// Utils
import { showToast, validateSubmissionData } from '../../../utils';
import { auth } from '../../../atoms';

function Login() {
  const INITIAL_FORM_DATA = {
    data: {
      email: '',
      password: '',
    },
    validations: {
      email: { isRequired: true, label: 'Email' },
      password: { isRequired: true, label: 'Password' },
    },
    errors: {},
  };

  const [formData, _formData] = useState({ ...INITIAL_FORM_DATA });
  const [isLoading, _isLoading] = useState(false);
  const [error, _error] = useState(null);

  const setAuth = useSetAtom(auth);

  // Clear error when user changes email or password
  useEffect(() => {
    if (error) _error(null);
  }, [formData.data.email, formData.data.password]);

  const handleChangeFormData = (e) => {
    const { name, value } = e.target;
    _formData((old) => ({
      ...old,
      data: {
        ...old.data,
        [name]: value,
      },
    }));
  };

  const handleValidateForm = () => {
    const { allValid, errors } = validateSubmissionData(
      formData.data,
      formData.validations
    );

    if (!allValid) {
      _formData((old) => ({
        ...old,
        errors,
      }));
    } else {
      _formData((old) => ({
        ...old,
        errors: {},
      }));
    }

    return allValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!handleValidateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    const payload = JSON.stringify({
      email: formData.data.email,
      password: formData.data.password,
    });
    _isLoading(true);
    _error(null);
    LoginRequest(payload)
      .then((result) => {
        setAuth(result?.token ?? result ?? true);
        showToast('Login successful', 'success');
      })
      .catch((err) => {
        const message = err?.message ?? 'Login failed. Please try again.';
        _error(message);
        showToast(message, 'error');
      })
      .finally(() => {
        _isLoading(false);
      });
  };

  const HERO_LEFT = () => (
    <Fragment>
      <div>
        {/* 
        <a href="javascript:void(0)">
          <img
            src="https://readymadeui.com/readymadeui-white.svg"
            alt="logo"
            className="w-40"
          />
        </a>
         */}
        <div className="max-w-lg mt-16 max-lg:hidden">
          <h1 className="text-4xl font-semibold text-white">Sign in</h1>
          <p className="text-[15px] mt-4 text-slate-100 leading-relaxed">
            Embark on a seamless journey as you sign in to your account. Unlock
            a realm of opportunities and possibilities that await you.
          </p>
        </div>
      </div>
    </Fragment>
  );

  const FORM_HEADER = () => (
    <Fragment>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-slate-900">Sign in</h2>
      </div>
    </Fragment>
  );

  const EMAIL_FIELD = () => (
    <Fragment>
      <div>
        <label className="text-slate-900 text-sm font-medium mb-2 block">
          Email
        </label>
        <div className="relative flex items-center">
          <input
            name="email"
            type="email"
            required
            className="w-full text-sm text-slate-900 border border-slate-300 pr-8 px-4 py-3 rounded-md outline-blue-600"
            placeholder="Enter email"
            value={formData.data.email}
            onChange={handleChangeFormData}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#bbb"
            stroke="#bbb"
            className="w-[18px] h-[18px] absolute right-4"
            viewBox="0 0 24 24"
          >
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </div>
        {formData.errors.email && (
          <span className="text-xs text-tomato">{formData.errors.email}</span>
        )}
      </div>
    </Fragment>
  );

  const PASSWORD_FIELD = () => (
    <Fragment>
      <div>
        <label className="text-slate-900 text-sm font-medium mb-2 block">
          Password
        </label>
        <div className="relative flex items-center">
          <input
            name="password"
            type="password"
            required
            className="w-full text-sm text-slate-900 border border-slate-300 pr-8 px-4 py-3 rounded-md outline-blue-600"
            placeholder="Enter password"
            value={formData.data.password}
            onChange={handleChangeFormData}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#bbb"
            stroke="#bbb"
            className="w-[18px] h-[18px] absolute right-4 cursor-pointer"
            viewBox="0 0 128 128"
          >
            <path d="M64 104C22.127 104 1.367 67.496.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24s62.633 36.504 63.496 38.057a4 4 0 0 1 0 3.887C126.633 67.496 105.873 104 64 104zM8.707 63.994C13.465 71.205 32.146 96 64 96c31.955 0 50.553-24.775 55.293-31.994C114.535 56.795 95.854 32 64 32 32.045 32 13.447 56.775 8.707 63.994zM64 88c-13.234 0-24-10.766-24-24s10.766-24 24-24 24 10.766 24 24-10.766 24-24 24zm0-40c-8.822 0-16 7.178-16 16s7.178 16 16 16 16-7.178 16-16-7.178-16-16-16z"></path>
          </svg>
        </div>
        {formData.errors.password && (
          <span className="text-xs text-tomato">{formData.errors.password}</span>
        )}
      </div>
    </Fragment>
  );

  const FORGOT_LINK = () => (
    <Fragment>
      <div className="text-right">
        <a
          href="/reset-password"
          className="text-blue-600 text-sm font-medium hover:underline"
        >
          Forgot your password?
        </a>
      </div>
    </Fragment>
  );

  const SUBMIT_BUTTON = () => (
    <Fragment>
      <div className="mt-8">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full shadow-xl py-2 px-4 text-[15px] font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </Fragment>
  );

  const FORM_FOOTER = () => (
    <Fragment>
      <p className="text-sm mt-6 text-center text-slate-600">
        <span className="text-blue-600 font-medium hover:underline ml-1 whitespace-nowrap">
          Reset password
        </span>
      </p>
    </Fragment>
  );

  const FORM_FIELDS = () => (
    <Fragment>
      <div className="space-y-6">
        {EMAIL_FIELD()}
        {PASSWORD_FIELD()}
        {FORGOT_LINK()}
      </div>
    </Fragment>
  );

  const FORM_CARD = () => (
    <Fragment>
      <div className="bg-white rounded-xl sm:px-6 px-4 py-8 max-w-md w-full h-max shadow-[0_2px_10px_-3px_rgba(6,81,237,0.3)] max-lg:mx-auto">
        <form onSubmit={handleSubmit}>
          {FORM_HEADER()}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          {FORM_FIELDS()}
          {SUBMIT_BUTTON()}
          {FORM_FOOTER()}
        </form>
      </div>
    </Fragment>
  );

  const HERO_RIGHT = () => (
    <Fragment>
      <div className="pb-4">
        {FORM_CARD()}
      </div>
    </Fragment>
  );

  const LAYOUT = () => (
    <Fragment>
      <div className="grid lg:grid-cols-2 gap-4 max-lg:gap-12 bg-gradient-to-r from-blue-500 to-blue-700 sm:px-8 px-4 py-12 h-[320px]">
        {HERO_LEFT()}
        {HERO_RIGHT()}
      </div>
    </Fragment>
  );

  const CONTENT = () => (
    <Fragment>
      {LAYOUT()}
    </Fragment>
  );

  return (
    <div>
      {CONTENT()}
    </div>
  );
}

export default Login;
