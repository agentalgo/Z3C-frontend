// Packages
import { Fragment } from 'react';

// Utils
import { showToast } from '../../../utils';

function ResetPassword() {

  // *********** Handlers ***********

  const handleReset = () => {
    showToast('Reset link sent to your email!', 'info');
  };

  // *********** Render Functions ***********

  const CONTENT = () => (
    <Fragment>
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] dark:bg-[#0f1323]">
        <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] p-8 w-full max-w-md shadow-lg">
          <h1 className="text-2xl font-bold text-[#0d121b] dark:text-white mb-4">Reset Password</h1>
          <p className="text-sm text-[#4c669a] dark:text-gray-400 mb-4">
            Enter your email address and we will send you a reset link.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleReset();
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-[#0d121b] dark:text-white block mb-1">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#0d121b] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              className="w-full text-white bg-primary px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Send Reset Link
            </button>
          </form>
        </div>
      </div>
    </Fragment>
  );

  return (
    <div id="reset-password">
      {CONTENT()}
    </div>
  );
}

export default ResetPassword;
