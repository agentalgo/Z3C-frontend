// Packages
import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// APIs
import { ForgotPasswordRequest, ResetPasswordRequest } from '../../../requests';

// Utils
import { showToast, validateSubmissionData } from '../../../utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotResetPassword() {
  const navigate = useNavigate();
  const INITIAL_FORM_DATA = {
    data: {
      email: '',
      otpCode: '',
      newPassword: '',
      confirmPassword: '',
    },
    validations: {
      email: { isRequired: true, label: 'Email', regex: EMAIL_REGEX },
      otpCode: { isRequired: true, label: 'OTP Code' },
      newPassword: { isRequired: true, label: 'New Password' },
      confirmPassword: { isRequired: true, label: 'Confirm Password' },
    },
    errors: {},
  };

  const [formData, _formData] = useState(INITIAL_FORM_DATA);
  const [isOtpSend, _isOtpSend] = useState(false);
  const [tempToken, _tempToken] = useState('');
  const [isLoading, _isLoading] = useState(false);

  // *********** Handlers ***********

  const handleChangeFormData = (e) => {
    const { name, value } = e.target;
    _formData((old) => ({
      ...old,
      data: {
        ...old.data,
        [name]: value,
      },
      errors: {
        ...old.errors,
        [name]: '',
      },
    }));
  };

  const handleValidateForm = () => {
    const validationsToUse = isOtpSend
      ? {
        otpCode: formData.validations.otpCode,
        newPassword: formData.validations.newPassword,
        confirmPassword: formData.validations.confirmPassword,
      }
      : { email: formData.validations.email };

    const dataToValidate = isOtpSend
      ? {
        otpCode: formData.data.otpCode,
        newPassword: formData.data.newPassword,
        confirmPassword: formData.data.confirmPassword,
      }
      : { email: formData.data.email };

    const { allValid, errors } = validateSubmissionData(dataToValidate, validationsToUse);
    let nextErrors = { ...errors };
    let isValid = allValid;

    if (
      isOtpSend &&
      !errors.confirmPassword &&
      formData.data.newPassword !== formData.data.confirmPassword
    ) {
      nextErrors.confirmPassword = 'Confirm Password must match New Password';
      isValid = false;
    }

    _formData((old) => ({
      ...old,
      errors: nextErrors,
    }));

    return isValid;
  };

  const handleRequestOtp = () => {
    _isLoading(true);

    ForgotPasswordRequest({ email: formData.data.email.trim() })
      .then((result) => {
        const nextTempToken = result?.data?.tempToken ?? result?.tempToken;
        const successMessage =
          result?.message ??
          result?.data?.message ??
          'OTP sent successfully. Please check your email.';

        if (!nextTempToken) {
          throw new Error('Temporary token not received from forgot password response.');
        }

        _tempToken(nextTempToken);
        _isOtpSend(true);
        _formData((old) => ({
          ...old,
          data: {
            ...old.data,
            otpCode: '',
            newPassword: '',
            confirmPassword: '',
          },
          errors: {},
        }));
        showToast(successMessage, 'success');
      })
      .catch((err) => {
        showToast(err?.message || 'Failed to send OTP. Please try again.', 'error');
      })
      .finally(() => {
        _isLoading(false);
      });
  };

  const handleResetPassword = () => {
    _isLoading(true);

    ResetPasswordRequest({
      tempToken,
      newPassword: formData.data.newPassword,
      otpCode: formData.data.otpCode.trim(),
    })
      .then((result) => {
        const successMessage =
          result?.message ??
          result?.data?.message ??
          'Password reset successfully. Please sign in.';

        showToast(successMessage, 'success');
        navigate('/login');
      })
      .catch((err) => {
        showToast(err?.message || 'Failed to reset password. Please try again.', 'error');
      })
      .finally(() => {
        _isLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLoading) {
      showToast('Please wait for the current request to finish', 'error');
      return;
    }

    if (!handleValidateForm()) {
      showToast('Please correct the highlighted fields', 'error');
      return;
    }

    if (isOtpSend) {
      handleResetPassword();
      return;
    }

    handleRequestOtp();
  };

  const handleUseAnotherEmail = () => {
    _isOtpSend(false);
    _tempToken('');
    _formData((old) => ({
      ...old,
      data: {
        ...old.data,
        otpCode: '',
        newPassword: '',
        confirmPassword: '',
      },
      errors: {},
    }));
  };

  // *********** Render Functions ***********

  const INPUT_CLASSNAME = 'w-full px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#0d121b] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors';

  const EMAIL_FIELD = () => (
    <div>
      <label className="text-xs font-semibold text-[#0d121b] dark:text-white block mb-1">
        Email
      </label>
      <input
        name="email"
        type="email"
        required
        value={formData.data.email}
        onChange={handleChangeFormData}
        autoComplete="email"
        className={INPUT_CLASSNAME}
        placeholder="you@example.com"
      />
      {formData.errors.email && (
        <span className="text-xs text-tomato">{formData.errors.email}</span>
      )}
    </div>
  );

  const RESET_FIELDS = () => (
    <Fragment>
      <div className="rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-[#f8fafc] dark:bg-[#111827] p-3">
        <p className="text-xs text-[#4c669a] dark:text-gray-400">
          OTP sent to <span className="font-semibold text-[#0d121b] dark:text-white">{formData.data.email}</span>
        </p>
      </div>

      <div>
        <label className="text-xs font-semibold text-[#0d121b] dark:text-white block mb-1">
          OTP Code
        </label>
        <input
          name="otpCode"
          type="text"
          required
          value={formData.data.otpCode}
          onChange={handleChangeFormData}
          autoComplete="one-time-code"
          inputMode="numeric"
          className={INPUT_CLASSNAME}
          placeholder="Enter OTP code"
        />
        {formData.errors.otpCode && (
          <span className="text-xs text-tomato">{formData.errors.otpCode}</span>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-[#0d121b] dark:text-white block mb-1">
          New Password
        </label>
        <input
          name="newPassword"
          type="password"
          required
          value={formData.data.newPassword}
          onChange={handleChangeFormData}
          autoComplete="new-password"
          className={INPUT_CLASSNAME}
          placeholder="Enter new password"
        />
        {formData.errors.newPassword && (
          <span className="text-xs text-tomato">{formData.errors.newPassword}</span>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-[#0d121b] dark:text-white block mb-1">
          Confirm Password
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          value={formData.data.confirmPassword}
          onChange={handleChangeFormData}
          autoComplete="new-password"
          className={INPUT_CLASSNAME}
          placeholder="Confirm new password"
        />
        {formData.errors.confirmPassword && (
          <span className="text-xs text-tomato">{formData.errors.confirmPassword}</span>
        )}
      </div>
    </Fragment>
  );

  const CONTENT = () => (
    <Fragment>
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] dark:bg-[#0f1323] px-4">
        <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] p-8 w-full max-w-md shadow-lg">
          <h1 className="text-2xl font-bold text-[#0d121b] dark:text-white mb-4">
            {isOtpSend ? 'Set a New Password' : 'Forgot Password'}
          </h1>
          <p className="text-sm text-[#4c669a] dark:text-gray-400 mb-4">
            {isOtpSend
              ? 'Enter the OTP code sent to your email and choose a new password.'
              : 'Enter your email address and we will send you an OTP code to reset your password.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Hidden decoy fields help prevent aggressive browser autofill on reset flows. */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              tabIndex="-1"
              className="hidden"
              aria-hidden="true"
            />
            <input
              type="password"
              name="current-password"
              autoComplete="current-password"
              tabIndex="-1"
              className="hidden"
              aria-hidden="true"
            />

            {!isOtpSend ? EMAIL_FIELD() : RESET_FIELDS()}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white bg-primary px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading
                ? (isOtpSend ? 'Resetting Password...' : 'Sending OTP...')
                : (isOtpSend ? 'Reset Password' : 'Send OTP')}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-primary hover:underline"
            >
              Back to sign in
            </button>

            {isOtpSend && (
              <button
                type="button"
                onClick={handleUseAnotherEmail}
                className="text-sm text-[#4c669a] dark:text-gray-400 hover:underline"
              >
                Use another email
              </button>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );

  return (
    <div id="forgot-reset-password">
      {CONTENT()}
    </div>
  );
}

export default ForgotResetPassword;
