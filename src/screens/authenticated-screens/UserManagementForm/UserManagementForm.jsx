// Packages
import { Fragment, useState, useMemo, Suspense, use, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';

// APIs
import { UserCreateRequest, UserDetailRequest, UserUpdateRequest } from '../../../requests';

// Utils
import { Footer, ErrorFallback } from '../../../components';
import { showToast, validateSubmissionData, decodeString, parseLoginInfo, getNormalizedModulePermissions } from '../../../utils';
import { auth, loginInfo } from '../../../atoms';

const PERMISSION_MODULES = ['invoice', 'customer', 'profile', 'companyProfile', 'user', 'dashboard', 'zatcaReporting', 'audit'];
const READ_ONLY_MODULES = ['dashboard', 'zatcaReporting', 'audit'];
const MODULE_LABELS = {
  invoice: 'Invoice',
  customer: 'Customer',
  profile: 'Customer Profile',
  companyProfile: 'Company Profile',
  zatcaReporting: 'ZATCA Reporting',
  audit: 'Audit Log',
  user: 'User Management',
  dashboard: 'Dashboard',
};
const CRUD_ACTIONS = ['read', 'create', 'update', 'delete'];
const USER_ROLES = ["Admin", "Manager", "Accountant", "Viewer"];

const getEmptyPermissions = () =>
  PERMISSION_MODULES.reduce((acc, module) => {
    acc[module] = { read: false, create: false, update: false, delete: false };
    return acc;
  }, {});

const getAllPermissions = () =>
  PERMISSION_MODULES.reduce((acc, module) => {
    if (READ_ONLY_MODULES.includes(module)) {
      acc[module] = { read: true, create: false, update: false, delete: false };
    } else {
      acc[module] = { read: true, create: true, update: true, delete: true };
    }
    return acc;
  }, {});

const INITIAL_FORM_DATA = {
  data: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    permissions: getEmptyPermissions(),
    role: 'Admin',
    isActive: true,
    isAdmin: false,
  },
  validations: {
    password: { isRequired: true, regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/ },
    username: { isRequired: true, label: "User Name" },
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
  const loginInfoValue = useAtomValue(loginInfo);
  const userPerms = useMemo(() => getNormalizedModulePermissions(parseLoginInfo(loginInfoValue), 'user'), [loginInfoValue]);
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
            if (apiData.permissions && typeof apiData.permissions === 'object') {
              return PERMISSION_MODULES.reduce((acc, module) => {
                const mp = apiData.permissions[module] || {};
                const isReadOnlyModule = READ_ONLY_MODULES.includes(module);
                acc[module] = {
                  read: !!mp.read,
                  create: isReadOnlyModule ? false : !!mp.create,
                  update: isReadOnlyModule ? false : !!mp.update,
                  delete: isReadOnlyModule ? false : !!mp.delete,
                };
                return acc;
              }, {});
            }
            return getEmptyPermissions();
          })(),
          role: apiData.role && USER_ROLES.includes(apiData.role) ? apiData.role : 'Admin',
          isActive: typeof apiData.isActive === 'string'
            ? apiData.isActive === 'Yes'
            : !!apiData.isActive,
          isAdmin: typeof apiData.isAdmin === 'string'
            ? apiData.isAdmin === 'Yes'
            : !!apiData.isAdmin,
          password: '',
          confirmPassword: '',
        },
        validations: {
          ...old.validations,
          password: { isRequired: false, label: "Password" },
          confirmPassword: { isRequired: false, label: "Confirm Password" },
        }
      }));
    } else if (userData?.isError) {
      _formData({ ...INITIAL_FORM_DATA });
    } else if (!id) {
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

  const handleToggleIsActive = (e) => {
    _formData(old => ({
      ...old,
      data: { ...old.data, isActive: e.target.checked },
    }));
  };

  const handleTogglePermission = (module, action) => {
    _formData(old => ({
      ...old,
      data: {
        ...old.data,
        permissions: {
          ...old.data.permissions,
          [module]: {
            ...old.data.permissions[module],
            [action]: !old.data.permissions[module][action],
          },
        },
      },
    }));
  };

  const handleToggleModuleAll = (module, value) => {
    const isReadOnlyModule = READ_ONLY_MODULES.includes(module);
    _formData(old => ({
      ...old,
      data: {
        ...old.data,
        permissions: {
          ...old.data.permissions,
          [module]: isReadOnlyModule
            ? {
                read: value,
                create: false,
                update: false,
                delete: false,
              }
            : {
                read: value,
                create: value,
                update: value,
                delete: value,
              },
        },
      },
    }));
  };

  const handleToggleAllPermissions = (value) => {
    _formData(old => ({
      ...old,
      data: {
        ...old.data,
        permissions: value ? getAllPermissions() : getEmptyPermissions(),
      },
    }));
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

    if (formData.data.password && formData.data.password !== formData.data.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    const hasAnyPermission = PERMISSION_MODULES.some((module) => {
      const mp = formData.data.permissions[module];
      return mp && (mp.read || mp.create || mp.update || mp.delete);
    });
    if (!hasAnyPermission) {
      showToast('Please grant at least one permission', 'error');
      return;
    }

    if (handleValidateForm()) {
      _isLoading(true);

      const payload = {
        username: formData.data.username,
        email: formData.data.email,
        isActive: !!formData.data.isActive,
        isAdmin: !!formData.data.isAdmin,
        role: formData.data.role || 'Admin',
        permissions: PERMISSION_MODULES.reduce((acc, module) => {
          const mp = formData.data.permissions[module] || {};
          const isReadOnlyModule = READ_ONLY_MODULES.includes(module);
          acc[module] = {
            read: !!mp.read,
            create: isReadOnlyModule ? false : !!mp.create,
            update: isReadOnlyModule ? false : !!mp.update,
            delete: isReadOnlyModule ? false : !!mp.delete,
          };
          return acc;
        }, {}),
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

      {/* Temporarily hidden role selector
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#0d121b] dark:text-white">Role</label>
        <Select
          name="role"
          classNamePrefix="react-select"
          className="text-sm"
          onChange={handleChangeRole}
          options={USER_ROLES.map((role) => ({
            value: role,
            label: role,
          }))}
          value={formData.data.role ? {
            value: formData.data.role,
            label: formData.data.role,
          } : {
            value: 'Admin',
            label: 'Admin',
          }}
        />
      </div>
      */}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Permissions *</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleToggleAllPermissions(true)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Grant All
            </button>
            <span className="text-xs text-[#4c669a]">·</span>
            <button
              type="button"
              onClick={() => handleToggleAllPermissions(false)}
              className="text-xs font-semibold text-[#4c669a] hover:text-[#0d121b] dark:hover:text-white hover:underline"
            >
              Revoke All
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f9fc] dark:bg-[#1a253a]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-wider w-48">
                  Module
                </th>
                {CRUD_ACTIONS.map((action) => (
                  <th key={action} className="px-4 py-3 text-center text-xs font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-wider">
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-wider">
                  All
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebf3] dark:divide-[#2a3447]">
              {PERMISSION_MODULES.map((module) => {
                const mp = formData.data.permissions[module] || {};
                const moduleActions = READ_ONLY_MODULES.includes(module) ? ['read'] : CRUD_ACTIONS;
                const allChecked = moduleActions.every((a) => !!mp[a]);
                const someChecked = moduleActions.some((a) => !!mp[a]);

                return (
                  <tr key={module} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[#0d121b] dark:text-white">
                      {MODULE_LABELS[module]}
                    </td>
                    {CRUD_ACTIONS.map((action) => (
                      <td key={action} className="px-4 py-3 text-center">
                        {READ_ONLY_MODULES.includes(module) && action !== 'read' ? (
                          <span className="text-[11px] text-[#9ca3af] italic">N/A</span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={!!mp[action]}
                            onChange={() => handleTogglePermission(module, action)}
                            className="w-4 h-4 rounded border-[#e7ebf3] dark:border-[#2a3447] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary"
                          />
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = someChecked && !allChecked;
                        }}
                        onChange={(e) => handleToggleModuleAll(module, e.target.checked)}
                        className="w-4 h-4 rounded border-[#e7ebf3] dark:border-[#2a3447] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
          </div>
          {formData.errors.password && (
            <span className="text-xs text-tomato">
              {
                formData.errors.password?.includes('valid')
                  ? 'Password should be alphanumeric with special characters'
                  : formData.errors.password
              }
            </span>
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
            onChange={handleToggleIsActive}
            className="w-4 h-4 rounded border-[#e7ebf3] dark:border-[#2a3447] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-[#0d121b] dark:text-white cursor-pointer">
            Is Active
          </label>
        </div>

        {/* Temporarily hidden isAdmin control
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isAdmin"
            name="isAdmin"
            checked={formData.data.isAdmin}
            onChange={handleToggleIsAdmin}
            className="w-4 h-4 rounded border-[#e7ebf3] dark:border-[#2a3447] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="isAdmin" className="text-sm font-medium text-[#0d121b] dark:text-white cursor-pointer">
            Is Admin
          </label>
        </div>
        */}
      </div>
    </section>
  );

  const FORM_ACTIONS = () => (
    <div className="flex gap-3 pt-6">
      {(!id || userPerms.update) && (
        <button
          type="submit"
          disabled={isLoading || userData?.isError}
          onClick={handleSubmitForm}
          className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'SAVING...' : 'SAVE'}
        </button>
      )}
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
