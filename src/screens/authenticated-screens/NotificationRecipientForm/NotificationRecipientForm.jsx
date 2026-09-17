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
          <div className="breeze-page flex-1">
            <div className="breeze-form-card px-6 py-10">
              <div className="flex items-center justify-center gap-2 text-[var(--z3c-subtle)]">
                <span className="material-symbols-outlined animate-spin">sync</span>
                Loading recipient details...
              </div>
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
    <div id="notification-recipient-form" className="flex min-h-0 flex-1 flex-col">
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
    e.preventDefault();

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

  const inputClassName = (name, locked = false) => {
    const classes = ['breeze-form-input'];
    if (formData.errors[name]) classes.push('breeze-form-input--invalid');
    if (locked) classes.push('breeze-form-input--locked');
    return classes.join(' ');
  };

  const FIELD = ({ label, name, required, hint, children }) => (
    <div className="breeze-form-field">
      <label className="breeze-field__label" htmlFor={`recipient-${name}`}>
        {label}
        {required ? <span className="breeze-form-required" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {hint && !formData.errors[name] ? <p className="breeze-form-hint">{hint}</p> : null}
      {formData.errors[name] ? (
        <span className="breeze-field__error" id={`recipient-${name}-error`}>
          {formData.errors[name]?.includes('valid') ? 'Enter a valid email address' : formData.errors[name]}
        </span>
      ) : null}
    </div>
  );

  const SECTION_HEADER = ({ icon, title, lede }) => (
    <div className="breeze-form-section__header">
      <span className="breeze-form-section__badge" aria-hidden="true">
        <span className="material-symbols-outlined">{icon}</span>
      </span>
      <div>
        <h3 className="breeze-form-section__title">{title}</h3>
        {lede ? <p className="breeze-form-section__lede">{lede}</p> : null}
      </div>
    </div>
  );

  const PAGE_HEADER = () => (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <button
          type="button"
          onClick={() => navigate('/notification-recipients')}
          className="breeze-link breeze-page__back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Notification Recipients
        </button>
        <h2 className="breeze-page__title">
          {id ? 'Edit Recipient' : 'Add Recipient'}
        </h2>
        <p className="breeze-page__lede">
          {id
            ? 'Update recipient details or active status'
            : 'Add an email address to receive rejection notifications'}
        </p>
      </div>
    </div>
  );

  const RECIPIENT_SECTION = () => (
    <section className="breeze-form-section">
      {SECTION_HEADER({
        icon: 'mail',
        title: 'Recipient details',
        lede: 'Email address and optional display name for rejection notifications.',
      })}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        {FIELD({
          label: 'Email Address',
          name: 'email',
          required: !id,
          hint: id ? 'Email cannot be changed after creation.' : undefined,
          children: (
            <input
              id="recipient-email"
              type="email"
              name="email"
              value={formData.data.email}
              onChange={id ? undefined : handleChange}
              readOnly={!!id}
              disabled={!!id}
              placeholder="recipient@example.com"
              aria-invalid={Boolean(formData.errors.email)}
              aria-describedby={formData.errors.email ? 'recipient-email-error' : undefined}
              className={inputClassName('email', !!id)}
            />
          ),
        })}
        {FIELD({
          label: 'Display Name',
          name: 'name',
          hint: 'Optional label shown alongside the email address.',
          children: (
            <input
              id="recipient-name"
              type="text"
              name="name"
              value={formData.data.name}
              onChange={handleChange}
              placeholder="e.g. Finance Team"
              className={inputClassName('name')}
            />
          ),
        })}
      </div>

      <label className="breeze-check w-fit max-w-full">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          className="breeze-check__box"
          checked={formData.data.isActive}
          onChange={handleChange}
        />
        <span className="text-sm sm:text-base">
          Active — include in rejection notification emails
        </span>
      </label>
    </section>
  );

  const FORM_ACTIONS = () => (
    <div className="breeze-form-actions">
      <button
        type="button"
        onClick={() => navigate('/notification-recipients')}
        className="breeze-btn breeze-btn--outline breeze-btn--inline w-full sm:w-auto"
      >
        Cancel
      </button>
      {(!id || recipientPerms.update) && (
        <button
          type="submit"
          disabled={isLoading || recipientData?.isError}
          className="breeze-btn breeze-btn--primary breeze-btn--inline w-full sm:w-auto min-w-[140px]"
        >
          {isLoading ? (
            <Fragment>
              <span className="breeze-btn__spinner" aria-hidden="true" />
              Saving...
            </Fragment>
          ) : (
            <Fragment>
              <span className="material-symbols-outlined text-[18px]">save</span>
              {id ? 'Save changes' : 'Add recipient'}
            </Fragment>
          )}
        </button>
      )}
    </div>
  );

  const RECIPIENT_FORM = () => (
    <div className="breeze-form-card">
      <form className="breeze-form" onSubmit={handleSubmit} noValidate>
        {recipientData?.isError && (
          <div className="breeze-alert" role="alert">
            <span className="material-symbols-outlined">error</span>
            <span>Unable to load this recipient. You can go back to the list and try again.</span>
          </div>
        )}
        {RECIPIENT_SECTION()}
        {FORM_ACTIONS()}
      </form>
    </div>
  );

  const CONTENT = () => (
    <Fragment>
      <div className="breeze-page flex-1">
        {PAGE_HEADER()}
        {RECIPIENT_FORM()}
      </div>
      <Footer />
    </Fragment>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {CONTENT()}
    </div>
  );
}

export default NotificationRecipientForm;
