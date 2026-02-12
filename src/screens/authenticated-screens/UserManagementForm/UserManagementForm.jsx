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

const PERMISSION_MODULES = ['invoice', 'customer', 'profile', 'companyProfile', 'zatcaReporting'];

const INITIAL_FORM_DATA = {
  data: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    permissions: [],
    isActive: true,
    isAdmin: false,
  },
  validations: {
    password: { isRequired: true, regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/ },
    username: { isRequired: true, label: "User Name" },
    permissions: { isRequired: true, isArray: true, label: "Permissions" },
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
  const [isReadOnly, _isReadOnly] = useState(true);
  const [isShowConfirmPassword, _isShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (userData?.data) {
      const apiData = userData.data;
      _formData(old => ({
        ...old,
        data: {
          ...old.data,
          username: apiData.username || '',
          email: apiData.email || '',
          permissions: (() => {
            // Prefer permissions object from API if available
            if (apiData.permissions && typeof apiData.permissions === 'object') {
              const selected = PERMISSION_MODULES.filter((module) => {
                const modPerm = apiData.permissions[module];
                if (!modPerm) return false;
                return !!(modPerm.create || modPerm.read || modPerm.update || modPerm.delete);
              });
              if (selected.length > 0) return selected;
            }
            // Fallback to roles/assignedRoles if backend still returns those
            if (Array.isArray(apiData.roles)) return apiData.roles;
            if (Array.isArray(apiData.assignedRoles)) return apiData.assignedRoles;
            return old.data.permissions || [];
          })(),
          isActive: typeof apiData.isActive === 'string'
            ? apiData.isActive === 'Yes'
            : !!apiData.isActive,
          isAdmin: typeof apiData.isAdmin === 'string'
            ? apiData.isAdmin === 'Yes'
            : !!apiData.isAdmin,
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
      // Create mode - reset to a clean, empty form and ensure password is required
      _formData({ ...INITIAL_FORM_DATA });
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

      const selectedPermissions = Array.isArray(formData.data.permissions)
        ? formData.data.permissions
        : [];

      // Helper to build CRUD permissions for a module
      const buildModulePermissions = (module) => {
        const enabled = selectedPermissions.includes(module);
        return {
          create: enabled,
          read: enabled,
          update: enabled,
          delete: enabled,
        };
      };

      // Build payload based on backend sample schema from `user-create-sample-payload.txt`
      const payload = {
        username: formData.data.username,
        email: formData.data.email,
        // Backend sample shows `isActive` as a boolean
        isActive: !!formData.data.isActive,
        isAdmin: !!formData.data.isAdmin,
        permissions: {
          invoice: buildModulePermissions('invoice'),
          customer: buildModulePermissions('customer'),
          profile: buildModulePermissions('profile'),
          companyProfile: buildModulePermissions('companyProfile'),
          zatcaReporting: buildModulePermissions('zatcaReporting'),
        },
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
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">User Name *</label>
          <input
            type="text"
            name="username"
            value={formData.data.username}
            onChange={handleChangeFormData}
            placeholder="Enter username"
            readOnly={isReadOnly}
            onFocus={() => _isReadOnly(false)}
            onBlur={() => _isReadOnly(true)}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.username && (
            <span className="text-xs text-tomato">{formData.errors.username}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.data.email}
            onChange={handleChangeFormData}
            placeholder="Enter email"
            readOnly={isReadOnly}
            onFocus={() => _isReadOnly(false)}
            onBlur={() => _isReadOnly(true)}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.email && (
            <span className="text-xs text-tomato">{formData.errors.email}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#0d121b] dark:text-white">Permissions *</label>
        <Select
          isMulti
          name="permissions"
          classNamePrefix="react-select"
          className="text-sm"
          options={[
            { value: 'invoice', label: 'Invoice' },
            { value: 'customer', label: 'Customer' },
            { value: 'profile', label: 'Profile' },
            { value: 'companyProfile', label: 'Company Profile' },
            { value: 'zatcaReporting', label: 'ZATCA Reporting' },
          ]}
          value={formData.data.permissions.map((perm) => {
            const option = {
              invoice: 'Invoice',
              customer: 'Customer',
              profile: 'Profile',
              companyProfile: 'Company Profile',
              zatcaReporting: 'ZATCA Reporting',
            }[perm] || perm;
            return {
              value: perm,
              label: option,
            };
          })}
          onChange={(selectedOptions) => {
            const values = Array.isArray(selectedOptions)
              ? selectedOptions.map((opt) => opt.value)
              : [];

            _formData(old => ({
              ...old,
              data: {
                ...old.data,
                permissions: values,
              },
            }));
          }}
        />
        {formData.errors.permissions && (
          <span className="text-xs text-tomato">{formData.errors.permissions}</span>
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
              readOnly={isReadOnly}
              onFocus={() => _isReadOnly(false)}
              onBlur={() => _isReadOnly(true)}
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
              autoComplete="off"
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

      <div className="flex flex-wrap items-center gap-4">
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isAdmin"
            name="isAdmin"
            checked={formData.data.isAdmin}
            onChange={(e) => {
              _formData(old => ({
                ...old,
                data: {
                  ...old.data,
                  isAdmin: e.target.checked,
                },
              }));
            }}
            className="w-4 h-4 rounded border-[#e7ebf3] dark:border-[#2a3447] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="isAdmin" className="text-sm font-medium text-[#0d121b] dark:text-white cursor-pointer">
            Is Admin
          </label>
        </div>
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
