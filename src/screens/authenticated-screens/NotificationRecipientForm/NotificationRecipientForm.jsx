// Packages
import { Fragment, useState, useMemo, Suspense, use, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';

// APIs
import {
  NotificationRecipientCreateRequest,
  NotificationRecipientDetailRequest,
  NotificationRecipientUpdateRequest,
} from '../../../requests';

// Utils
import { Footer, ErrorFallback } from '../../../components';
import { showToast, validateSubmissionData, decodeString, parseLoginInfo, getNormalizedModulePermissions } from '../../../utils';
import { auth, loginInfo } from '../../../atoms';

const INITIAL_FORM_DATA = {
  data: {
    email: '',
    name: '',
    isActive: true,
  },
  validations: {
    email: { isRequired: true, regex: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/ },
  },
  errors: {},
};

function NotificationRecipientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authValue = useAtomValue(auth);
  const decodedToken = useMemo(() => decodeString(authValue), [authValue]);

  const recipientPromise = useMemo(() => {
    if (id) {
      return NotificationRecipientDetailRequest(decodedToken, id).catch((err) => {
        console.error('Failed to fetch recipient details:', err);
        return { data: null, isError: true };
      });
    }
    return null;
  }, [id, decodedToken]);

  const CONTENT = () => (
    <Fragment>
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
        <Suspense fallback={
          <div className="p-8 flex items-center justify-center">
            <div className="flex items-center gap-2 text-[#4c669a]">
              <span className="material-symbols-outlined animate-spin">sync</span>
              Loading recipient details...
            </div>
          </div>
        }>
          <NotificationRecipientFormContent
            id={id}
            recipientPromise={recipientPromise}
            decodedToken={decodedToken}
            navigate={navigate}
          />
        </Suspense>
      </ErrorBoundary>
    </Fragment>
  );

  return (
    <div id="notification-recipient-form">
      {CONTENT()}
    </div>
  );
}

function NotificationRecipientFormContent({ id, recipientPromise, decodedToken, navigate }) {
  const recipientData = recipientPromise ? use(recipientPromise) : null;
  const loginInfoValue = useAtomValue(loginInfo);
  const recipientPerms = useMemo(
    () => getNormalizedModulePermissions(parseLoginInfo(loginInfoValue), 'notificationRecipient'),
    [loginInfoValue],
  );

  const [formData, _formData] = useState({ ...INITIAL_FORM_DATA });
  const [isLoading, _isLoading] = useState(false);

  useEffect(() => {
    if (recipientData?.data) {
      const d = recipientData.data;
      _formData((old) => ({
        ...old,
        data: {
          email: d.email || '',
          name: d.name || '',
          isActive: typeof d.isActive === 'boolean' ? d.isActive : true,
        },
        validations: {
          // email is read-only in edit mode — no need to validate it
          ...(id ? {} : old.validations),
        },
        errors: {},
      }));
    } else if (recipientData?.isError) {
      _formData({ ...INITIAL_FORM_DATA });
    } else if (!id) {
      _formData({ ...INITIAL_FORM_DATA });
    }
  }, [recipientData, id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    _formData((old) => ({
      ...old,
      data: { ...old.data, [name]: type === 'checkbox' ? checked : value },
    }));
  };

  const handleValidateForm = () => {
    const { allValid, errors } = validateSubmissionData(formData.data, formData.validations);
    _formData((old) => ({ ...old, errors: allValid ? {} : errors }));
    return allValid;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!handleValidateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    _isLoading(true);

    const payload = {
      name: formData.data.name || undefined,
      isActive: !!formData.data.isActive,
      ...(id ? {} : { email: formData.data.email }),
    };

    const request = id
      ? NotificationRecipientUpdateRequest(decodedToken, id, JSON.stringify(payload))
      : NotificationRecipientCreateRequest(decodedToken, JSON.stringify(payload));

    request
      .then(() => {
        showToast(id ? 'Recipient updated successfully!' : 'Recipient added successfully!', 'success');
        navigate('/notification-recipients');
      })
      .catch((err) => {
        showToast(err?.message || (id ? 'Failed to update recipient' : 'Failed to add recipient'), 'error');
      })
      .finally(() => _isLoading(false));
  };

  const PAGE_HEADER = () => (
    <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[#0d121b] dark:text-white text-3xl font-black leading-tight">
          {id ? 'Edit Recipient' : 'Add Recipient'}
        </h1>
        <p className="text-[#4c669a] text-base">
          {id ? 'Update recipient details or active status' : 'Add an email address to receive rejection notifications'}
        </p>
      </div>
    </div>
  );

  const FORM_FIELDS = () => (
    <section className="space-y-6">
      {/* Email — read-only in edit mode */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#0d121b] dark:text-white">
          Email Address {!id && '*'}
          {id && <span className="font-normal text-[#9ca3af] ml-1">(cannot be changed)</span>}
        </label>
        <input
          type="email"
          name="email"
          value={formData.data.email}
          onChange={id ? undefined : handleChange}
          readOnly={!!id}
          placeholder="recipient@example.com"
          className={`px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors md:w-1/2 ${id ? 'bg-[#f8f9fc] dark:bg-[#1a253a] text-[#9ca3af] cursor-default' : 'bg-white dark:bg-[#161f30]'}`}
        />
        {formData.errors.email && (
          <span className="text-xs text-tomato">{formData.errors.email?.includes('valid') ? 'Enter a valid email address' : formData.errors.email}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#0d121b] dark:text-white">
          Display Name <span className="font-normal text-[#9ca3af]">(optional)</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.data.name}
          onChange={handleChange}
          placeholder="e.g. Finance Team"
          className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors md:w-1/2"
        />
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.data.isActive}
          onChange={handleChange}
          className="w-4 h-4 rounded border-[#e7ebf3] dark:border-[#2a3447] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-[#0d121b] dark:text-white cursor-pointer">
          Active — include in rejection notification emails
        </label>
      </div>
    </section>
  );

  const FORM_ACTIONS = () => (
    <div className="flex gap-3 pt-6">
      {(!id || recipientPerms.update) && (
        <button
          type="submit"
          disabled={isLoading || recipientData?.isError}
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'SAVING...' : 'SAVE'}
        </button>
      )}
      <button
        type="button"
        onClick={() => navigate('/notification-recipients')}
        className="px-6 py-2.5 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors"
      >
        CANCEL
      </button>
    </div>
  );

  const FORM_CARD = () => (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden">
      <div className="p-6 space-y-6">
        {FORM_FIELDS()}
        {FORM_ACTIONS()}
      </div>
    </div>
  );

  const MAIN_CONTENT = () => (
    <div className="p-8 space-y-8">
      {PAGE_HEADER()}
      <div className="grid grid-cols-1 gap-8">
        {FORM_CARD()}
      </div>
    </div>
  );

  return (
    <Fragment>
      {MAIN_CONTENT()}
      <Footer />
    </Fragment>
  );
}

export default NotificationRecipientForm;
