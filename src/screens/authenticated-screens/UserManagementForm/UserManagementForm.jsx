// Packages
import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

// Utils
import { Footer } from '../../../components';
import { showToast, validateSubmissionData } from '../../../utils';

function UserManagementForm() {
  const navigate = useNavigate();
  
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
      password: { isRequired: true, label: "Password" },
      confirmPassword: { isRequired: true, label: "Password" },
      assignedRoles: { isRequired: true, isArray: true, label: "Roles" },
      email: { isRequired: true, regex: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/ },
    },
    errors: {},
  };
  const [isShowPassword, _isShowPassword] = useState(false);
  const [isShowConfirmPassword, _isShowConfirmPassword] = useState(false);
  const [formData, _formData] = useState({ ...INITIAL_FORM_DATA });

  /********  handlers  ********/
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
    e.preventDefault();
    if (handleValidateForm()) {
      console.log('Form is valid');
    } else {
      showToast('Please fill in all required fields', 'error');
    }
  };

  /********  Render functions  ********/
  const PAGE_HEADER = () => (
    <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[#0d121b] dark:text-white text-3xl font-black leading-tight">Create User</h1>
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
        onClick={handleSubmitForm}
        className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
      >
        SAVE
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
