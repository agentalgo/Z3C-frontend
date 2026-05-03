// Packages
import { Fragment, useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { useAtomValue } from 'jotai';

// APIs
import { CustomerProfileCreateRequest, CustomerProfileDetailRequest, CustomerProfileTemplatesListRequest, CustomerProfileUpdateRequest } from '../../../requests';

// Utils
import { Footer } from '../../../components';
import { showToast, validateSubmissionData, decodeString, parseLoginInfo, getNormalizedModulePermissions } from '../../../utils';
import { auth, loginInfo } from '../../../atoms';

const INITIAL_FORM_DATA = {
  data: {
    // Top-level profile fields (from customer-profile-payload.txt)
    name: '',
    defaultTemplate: '',
    invoiceType: 'B2B',
    paymentTerms: '',

    // Bank details (nested in payload -> flattened for the form)
    bankName: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    swiftCode: '',
  },
  validations: {
    // Fields with "*" in payload are required
    name: { isRequired: true, label: 'Profile Name' },
    paymentTerms: { isRequired: true, label: 'Payment Terms' },
    bankName: { isRequired: true, label: 'Bank Name' },
    accountName: { isRequired: true, label: 'Account Name' },
    accountNumber: { isRequired: true, label: 'Account Number' },
    iban: { isRequired: true, label: 'IBAN' },
  },
  errors: {},
};

function CustomerProfileForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, _formData] = useState({ ...INITIAL_FORM_DATA });
  const [isLoading, _isLoading] = useState(false);
  const [isProfileLoading, _isProfileLoading] = useState(false);
  const authValue = useAtomValue(auth);
  const loginInfoValue = useAtomValue(loginInfo);
  const decodedToken = useMemo(() => decodeString(authValue), [authValue]);
  const customerProfilePerms = useMemo(() => getNormalizedModulePermissions(parseLoginInfo(loginInfoValue), 'profile'), [loginInfoValue]);
  const [templateOptions, _templateOptions] = useState([]);
  const [isTemplateLoading, _isTemplateLoading] = useState(false);

  // *********** Handlers ***********
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
    const { allValid, errors } = validateSubmissionData(formData.data, formData.validations);

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

  useEffect(() => {
    if (!decodedToken) return;

    _isTemplateLoading(true);
    CustomerProfileTemplatesListRequest(decodedToken)
      .then((response) => {
        const templatesSource =
          response?.templates ||
          response?.data?.templates ||
          response;
        const templates = Array.isArray(templatesSource) ? templatesSource : [];
        const options = templates.map((tpl) => ({
          value: tpl,
          label: tpl,
        }));
        _templateOptions(options);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load customer profile templates:', err);
        showToast('Failed to load customer profile templates', 'error');
      })
      .finally(() => {
        _isTemplateLoading(false);
      });
  }, [decodedToken]);

  // Load existing customer profile when editing
  useEffect(() => {
    if (!decodedToken || !id) return;

    let isCancelled = false;
    _isProfileLoading(true);

    CustomerProfileDetailRequest(decodedToken, id)
      .then((response) => {
        if (isCancelled) return;

        const apiData = response?.data || response;
        if (!apiData) return;

        _formData((old) => ({
          ...old,
          data: {
            ...old.data,
            name: apiData.name || '',
            defaultTemplate: apiData.defaultTemplate || '',
            invoiceType: apiData.invoiceType || '',
            paymentTerms: apiData.paymentTerms || '',
            bankName: apiData.bankDetails?.bankName || '',
            accountName: apiData.bankDetails?.accountName || '',
            accountNumber: apiData.bankDetails?.accountNumber || '',
            iban: apiData.bankDetails?.iban || '',
            swiftCode: apiData.bankDetails?.swiftCode || '',
          },
        }));
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load customer profile details:', err);
        showToast('Failed to load customer profile details', 'error');
      })
      .finally(() => {
        if (!isCancelled) {
          _isProfileLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [decodedToken, id]);

  const handleSubmitForm = (e) => {
    if (e) e.preventDefault();

    if (!handleValidateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!decodedToken) {
      showToast('Authentication is required to submit this form', 'error');
      return;
    }

    _isLoading(true);

    // Shape the payload similar to the sample structure
    const payload = {
      name: formData.data.name,
      defaultTemplate: formData.data.defaultTemplate || undefined,
      invoiceType: formData.data.invoiceType || undefined,
      paymentTerms: formData.data.paymentTerms,
      bankDetails: {
        bankName: formData.data.bankName,
        accountName: formData.data.accountName,
        accountNumber: formData.data.accountNumber,
        iban: formData.data.iban,
        swiftCode: formData.data.swiftCode || undefined,
      },
    };

    const request = id
      ? CustomerProfileUpdateRequest(decodedToken, id, JSON.stringify(payload))
      : CustomerProfileCreateRequest(decodedToken, JSON.stringify(payload));

    request
      .then(() => {
        showToast(
          id ? 'Customer profile updated successfully!' : 'Customer profile created successfully!',
          'success'
        );
        navigate('/customer-profile');
      })
      .catch((err) => {
        showToast(
          err?.message || (id ? 'Failed to update customer profile' : 'Failed to create customer profile'),
          'error'
        );
      })
      .finally(() => {
        _isLoading(false);
      });
  };

  // *********** Render Functions ***********
  const PAGE_HEADER = () => (
    <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[#0d121b] dark:text-white text-3xl font-black leading-tight">
          {id ? 'Edit Customer Profile' : 'Create Customer Profile'}
        </h1>
        <p className="text-sm text-[#4c669a] dark:text-[#9ca3af]">
          Configure customer profile defaults and bank details.
        </p>
      </div>
    </div>
  );

  const PROFILE_DETAILS_SECTION = () => (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">
            Profile Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.data.name}
            onChange={handleChangeFormData}
            placeholder="Enter profile name"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.name && (
            <span className="text-xs text-tomato">{formData.errors.name}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">
            Default Template
          </label>
          <Select
            instanceId="customer-profile-default-template"
            isClearable
            isLoading={isTemplateLoading}
            options={templateOptions}
            value={
              formData.data.defaultTemplate
                ? { value: formData.data.defaultTemplate, label: formData.data.defaultTemplate }
                : null
            }
            onChange={(option) => {
              const value = option ? option.value : '';
              _formData((old) => ({
                ...old,
                data: {
                  ...old.data,
                  defaultTemplate: value,
                },
              }));
            }}
            placeholder="Select default template..."
            classNamePrefix="react-select"
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">
            Invoice Type
          </label>
          <Select
            instanceId="customer-profile-invoice-type"
            isClearable={false}
            options={[
              { value: 'B2B', label: 'B2B' },
              { value: 'B2C', label: 'B2C' },
              { value: 'B2G', label: 'B2G' },
              { value: 'CREDIT_NOTE', label: 'CREDIT_NOTE', isDisabled: true },
              { value: 'DEBIT_NOTE', label: 'DEBIT_NOTE', isDisabled: true },
            ]}
            value={
              formData.data.invoiceType
                ? { value: formData.data.invoiceType, label: formData.data.invoiceType }
                : null
            }
            onChange={(option) => {
              const value = option ? option.value : '';
              _formData((old) => ({
                ...old,
                data: {
                  ...old.data,
                  invoiceType: value,
                },
              }));
            }}
            placeholder="Select invoice type..."
            classNamePrefix="react-select"
            className="text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">
            Payment Terms *
          </label>
          <input
            type="text"
            name="paymentTerms"
            value={formData.data.paymentTerms}
            onChange={handleChangeFormData}
            placeholder="e.g. Net 30"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.paymentTerms && (
            <span className="text-xs text-tomato">{formData.errors.paymentTerms}</span>
          )}
        </div>
      </div>
    </section>
  );

  const BANK_DETAILS_SECTION = () => (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#0d121b] dark:text-white">
        Bank Details
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">
            Bank Name *
          </label>
          <input
            type="text"
            name="bankName"
            value={formData.data.bankName}
            onChange={handleChangeFormData}
            placeholder="Enter bank name"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.bankName && (
            <span className="text-xs text-tomato">{formData.errors.bankName}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">
            Account Name *
          </label>
          <input
            type="text"
            name="accountName"
            value={formData.data.accountName}
            onChange={handleChangeFormData}
            placeholder="Enter account name"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.accountName && (
            <span className="text-xs text-tomato">{formData.errors.accountName}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">
            Account Number *
          </label>
          <input
            type="text"
            name="accountNumber"
            value={formData.data.accountNumber}
            onChange={handleChangeFormData}
            placeholder="Enter account number"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.accountNumber && (
            <span className="text-xs text-tomato">{formData.errors.accountNumber}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">
            IBAN *
          </label>
          <input
            type="text"
            name="iban"
            value={formData.data.iban}
            onChange={handleChangeFormData}
            placeholder="Enter IBAN"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.iban && (
            <span className="text-xs text-tomato">{formData.errors.iban}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">
            SWIFT Code
          </label>
          <input
            type="text"
            name="swiftCode"
            value={formData.data.swiftCode}
            onChange={handleChangeFormData}
            placeholder="Enter SWIFT code"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
      </div>
    </section>
  );

  const FORM_ACTIONS = () => (
    <div className="flex gap-3 pt-6">
      {(!id || customerProfilePerms.update) && (
        <button
          type="submit"
          disabled={isLoading}
          onClick={handleSubmitForm}
          className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'SAVING...' : 'SAVE'}
        </button>
      )}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="px-6 py-2.5 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors"
      >
        CANCEL
      </button>
    </div>
  );

  const FORM_CONTENT = () => (
    <div className="p-6 space-y-10">
      {PROFILE_DETAILS_SECTION()}
      {BANK_DETAILS_SECTION()}
      {FORM_ACTIONS()}
    </div>
  );

  const CUSTOMER_PROFILE_FORM = () => (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden">
      {FORM_CONTENT()}
    </div>
  );

  const MAIN_GRID = () => (
    <div className="grid grid-cols-1 gap-8">
      <div className="lg:col-span-8">
        {CUSTOMER_PROFILE_FORM()}
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
    <div id="customer-profile-form">
      {CONTENT()}
    </div>
  );
}

export default CustomerProfileForm;

