// Packages
import { Fragment, useState, useMemo, Suspense, use, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { useAtomValue } from 'jotai';

// APIs
import {
  UserCreateRequest,
  UserDetailRequest,
  UserUpdateRequest,
} from '../../../requests';

// Utils
import { Footer, ErrorFallback } from '../../../components';
import { showToast, validateSubmissionData, decodeString } from '../../../utils';
import { auth } from '../../../atoms';

const INITIAL_FORM_DATA = {
  data: {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    assignedRoles: [],
    isActive: true,
  },
  validations: {
    firstName: { isRequired: true, label: "First Name" },
    lastName: { isRequired: true, label: "Last Name" },
    assignedRoles: { isRequired: true, isArray: true, label: "Roles" },
    email: { isRequired: true, regex: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/ },
  },
  errors: {},
};

function UserManagementForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authValue = useAtomValue(auth);
  const decodedToken = useMemo(() => decodeString(authValue), [authValue]);

  const userPromise = useMemo(() => {
    if (id) {
      return UserDetailRequest(decodedToken, id).catch((err) => {
        console.error('Failed to fetch user details:', err);
        return { data: null, isError: true };
      });
    }
    return null;
  }, [id, decodedToken]);

  // *********** Render Functions ***********
  const CONTENT = () => (
    <Fragment>
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
        <Suspense fallback={
          <div className="p-8 flex items-center justify-center">
            <div className="flex items-center gap-2 text-[#4c669a]">
              <span className="material-symbols-outlined animate-spin">sync</span>
              Loading user details...
            </div>
          </div>
        }>
          <UserManagementFormContent
            id={id}
            userPromise={userPromise}
            decodedToken={decodedToken}
            navigate={navigate}
          />
        </Suspense>
      </ErrorBoundary>
    </Fragment>
  );

  return (
    <div id="user-management-form">
      {CONTENT()}
    </div>
  );
}

function UserManagementFormContent({ id, userPromise, decodedToken, navigate }) {
  const userData = userPromise ? use(userPromise) : null;
  const [formData, _formData] = useState({ ...INITIAL_FORM_DATA });
  const [isLoading, _isLoading] = useState(false);
  const [isShowPassword, _isShowPassword] = useState(false);
  const [isShowConfirmPassword, _isShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (userData?.data) {
      const apiData = userData.data;
      _formData(old => ({
        ...old,
        data: {
          ...old.data,
          firstName: apiData.firstName || '',
          lastName: apiData.lastName || '',
          email: apiData.email || '',
          assignedRoles: apiData.roles || apiData.assignedRoles || [],
          isActive: typeof apiData.isActive === 'string'
            ? apiData.isActive === 'Yes'
            : !!apiData.isActive,
          password: '', // Don't pre-fill password for security
          confirmPassword: '',
        },
        validations: {
          ...old.validations,
          // Password not required in edit mode unless user wants to change it
          password: { isRequired: false, label: "Password" },
          confirmPassword: { isRequired: false, label: "Confirm Password" },
        }
      }));
    } else if (userData?.isError) {
      _formData({ ...INITIAL_FORM_DATA });
    } else if (!id) {
      // Create mode - ensure password is required
      _formData(old => ({
        ...old,
        validations: {
          ...old.validations,
          password: { isRequired: true, label: "Password" },
          confirmPassword: { isRequired: true, label: "Confirm Password" },
        }
      }));
    }
  }, [userData, id]);

  // *********** Handlers ***********
  const handleChangeFormData = (e) => {
    _formData(old => ({
      ...old,
      data: {
        ...old.data,
        [e.target.name]: e.target.value,
      },
    }))
  };

  const handleValidateForm = () => {
    const { allValid, errors } = validateSubmissionData(formData.data, formData.validations);
    if (!allValid) {
      _formData(old => ({
        ...old,
        errors,
      }));
    } else {
      _formData(old => ({
        ...old,
        errors: {}
      }));
    }
    return allValid;
  };

  const handleSubmitForm = (e) => {
    if (e) e.preventDefault();

    // Check password match if provided
    if (formData.data.password && formData.data.password !== formData.data.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (handleValidateForm()) {
      _isLoading(true);

      const payload = {
        firstName: formData.data.firstName,
        lastName: formData.data.lastName,
        email: formData.data.email,
        roles: formData.data.assignedRoles,
        isActive: formData.data.isActive ? 'Yes' : 'No', // Mapping back to API format if needed
      };

      if (formData.data.password) {
        payload.password = formData.data.password;
      }

      const request = id
        ? UserUpdateRequest(decodedToken, id, JSON.stringify(payload))
        : UserCreateRequest(decodedToken, JSON.stringify(payload));

      request
        .then(() => {
          showToast(id ? 'User updated successfully!' : 'User created successfully!', 'success');
          navigate('/user-management');
        })
        .catch((err) => {
          showToast(err?.message || (id ? 'Failed to update user' : 'Failed to create user'), 'error');
        })
        .finally(() => {
          _isLoading(false);
        });
    } else {
      showToast('Please fill in all required fields', 'error');
    }
  };

  // *********** Render Functions ***********
  const PAGE_HEADER = () => (
    <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[#0d121b] dark:text-white text-3xl font-black leading-tight">
          {id ? 'Edit User' : 'Create User'}
        </h1>
      </div>
    </div>
  );

  const USER_DETAILS_SECTION = () => (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">First Name *</label>
          <input
            type="text"
            name="firstName"
            value={formData.data.firstName}
            onChange={handleChangeFormData}
            placeholder="Muhammad Taufiq"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.firstName && (
            <span className="text-xs text-tomato">{formData.errors.firstName}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={formData.data.lastName}
            onChange={handleChangeFormData}
            placeholder="Yusuf"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.lastName && (
            <span className="text-xs text-tomato">{formData.errors.lastName}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#0d121b] dark:text-white">Assigned Roles *</label>
        <Select
          isMulti
          name="assignedRoles"
          classNamePrefix="react-select"
          className="text-sm"
          options={[
            { value: 'accountant', label: 'accountant' },
            { value: 'admin', label: 'admin' },
            { value: 'manager', label: 'manager' },
            { value: 'viewer', label: 'viewer' },
          ]}
          value={formData.data.assignedRoles.map((role) => ({
            value: role,
            label: role,
          }))}
          onChange={(selectedOptions) => {
            const values = Array.isArray(selectedOptions)
              ? selectedOptions.map((opt) => opt.value)
              : [];

            _formData(old => ({
              ...old,
              data: {
                ...old.data,
                assignedRoles: values,
              },
            }));
          }}
        />
        {formData.errors.assignedRoles && (
          <span className="text-xs text-tomato">{formData.errors.assignedRoles}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#0d121b] dark:text-white">Email *</label>
        <input
          type="email"
          name="email"
          value={formData.data.email}
          onChange={handleChangeFormData}
          placeholder="muyusuf@spa.sa"
          className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
        {formData.errors.email && (
          <span className="text-xs text-tomato">{formData.errors.email}</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Password *</label>
          <div className="relative">
            <input
              type={isShowPassword ? 'text' : 'password'}
              name="password"
              value={formData.data.password}
              onChange={handleChangeFormData}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => _isShowPassword(!isShowPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4c669a] hover:text-[#0d121b] dark:hover:text-white"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isShowPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {formData.errors.password && (
            <span className="text-xs text-tomato">{formData.errors.password}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Confirm Password *</label>
          <div className="relative">
            <input
              type={isShowConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.data.confirmPassword}
              onChange={handleChangeFormData}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => _isShowConfirmPassword(!isShowConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4c669a] hover:text-[#0d121b] dark:hover:text-white"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isShowConfirmPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {formData.errors.confirmPassword && (
            <span className="text-xs text-tomato">{formData.errors.confirmPassword}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.data.isActive}
          onChange={(e) => {
            _formData(old => ({
              ...old,
              data: {
                ...old.data,
                isActive: e.target.checked,
              },
            }));
          }}
          className="w-4 h-4 rounded border-[#e7ebf3] dark:border-[#2a3447] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-[#0d121b] dark:text-white cursor-pointer">
          Is Active
        </label>
      </div>
    </section>
  );

  const FORM_ACTIONS = () => (
    <div className="flex gap-3 pt-6">
      <button
        type="submit"
        disabled={isLoading || userData?.isError}
        onClick={handleSubmitForm}
        className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'SAVING...' : 'SAVE'}
      </button>
      <button
        type="button"
        onClick={() => navigate('/user-management')}
        className="px-6 py-2.5 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors"
      >
        CANCEL
      </button>
    </div>
  );

  const FORM_CONTENT = () => (
    <div className="p-6 space-y-6">
      {USER_DETAILS_SECTION()}
      {FORM_ACTIONS()}
    </div>
  );

  const USER_FORM = () => (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden">
      {FORM_CONTENT()}
    </div>
  );

  const MAIN_GRID = () => (
    <div className="grid grid-cols-1 gap-8">
      <div className="lg:col-span-8">
        {USER_FORM()}
      </div>
    </div>
  );

  const MAIN_CONTENT = () => (
    <div className="p-8 space-y-8">
      {PAGE_HEADER()}
      {MAIN_GRID()}
    </div>
  );

  const CONTENT = () => (
    <Fragment>
      {MAIN_CONTENT()}
      <Footer />
    </Fragment>
  );

  return (
    <div>
      {CONTENT()}
    </div>
  );
}

export default UserManagementForm;
