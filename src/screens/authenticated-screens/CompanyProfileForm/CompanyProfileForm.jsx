// Packages
import { Fragment, useState, useMemo, Suspense, use, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';

// APIs
import {
  CompanyProfileCreateRequest,
  CompanyProfileDetailRequest,
  CompanyProfileUpdateRequest,
} from '../../../requests';

// Utils
import { Footer, ErrorFallback } from '../../../components';
import { showToast, validateSubmissionData, decodeString } from '../../../utils';
import { auth } from '../../../atoms';

const INITIAL_FORM_DATA = {
  data: {
    profileName: '',
    companyName: '',
    companyArabicName: '',
    email: '',
    phone: '',
    vatNumber: '',
    notes: '',
    invoiceType: '',
    crnNumber: '',
    branchName: '',
    branchIndustry: '',
    paymentTerms: '',
    bankDetailsSar: '',
    bankDetailsUsd: '',
    fullAddress: '',
    fullAddressArabic: '',
    street: '',
    additionalStreetAddress: '',
    buildingNumber: '',
    plotIdentification: '',
    citySubDivisionName: '',
    city: '',
    postCode: '',
    countrySubEntity: '',
    country: '',
    countryCode: '',
  },
  validations: {
    profileName: { isRequired: true, label: 'Profile Name' },
    companyName: { isRequired: true, label: 'Company Name' },
    email: {
      isRequired: true,
      label: 'Email',
      regex: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    },
    vatNumber: { isRequired: true, label: 'VAT Number' },
    invoiceType: { isRequired: true, label: 'Invoice Type' },
    crnNumber: { isRequired: true, label: 'CRN Number' },
    bankDetailsSar: { isRequired: true, label: 'Bank Details' },
    bankDetailsUsd: { isRequired: true, label: 'Bank Details USD' },
    city: { isRequired: true, label: 'City' },
    country: { isRequired: true, label: 'Country' },
    countryCode: { isRequired: true, label: 'Country Code' },
  },
  errors: {},
};

function CompanyProfileForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authValue = useAtomValue(auth);
  const decodedToken = useMemo(() => decodeString(authValue), [authValue]);

  const profilePromise = useMemo(() => {
    if (id) {
      return CompanyProfileDetailRequest(decodedToken, id).catch((err) => {
        console.error('Failed to fetch profile details:', err);
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
              Loading company profile...
            </div>
          </div>
        }>
          <CompanyProfileFormContent
            id={id}
            profilePromise={profilePromise}
            decodedToken={decodedToken}
            navigate={navigate}
          />
        </Suspense>
      </ErrorBoundary>
    </Fragment>
  );

  return (
    <div id="company-profile-form">
      {CONTENT()}
    </div>
  );
}

function CompanyProfileFormContent({ id, profilePromise, decodedToken, navigate }) {
  const profileData = profilePromise ? use(profilePromise) : null;
  const [formData, _formData] = useState({ ...INITIAL_FORM_DATA });
  const [isLoading, _isLoading] = useState(false);

  useEffect(() => {
    if (profileData?.data) {
      const apiData = profileData.data;
      _formData(old => ({
        ...old,
        data: {
          ...old.data,
          profileName: apiData.profileName || '',
          companyName: apiData.companyName || '',
          companyArabicName: apiData.companyArabicName || '',
          email: apiData.email || '',
          phone: apiData.phone || apiData.phoneNumber || '',
          vatNumber: apiData.vat || apiData.vatNumber || '',
          notes: apiData.notes || '',
          invoiceType: apiData.invoiceType || '',
          crnNumber: apiData.crnNumber || '',
          branchName: apiData.branchName || '',
          branchIndustry: apiData.branchIndustry || '',
          paymentTerms: apiData.paymentTerms || '',
          bankDetailsSar: apiData.bankDetailsSar || '',
          bankDetailsUsd: apiData.bankDetailsUsd || '',
          fullAddress: apiData.fullAddress || '',
          fullAddressArabic: apiData.fullAddressArabic || '',
          street: apiData.street || '',
          additionalStreetAddress: apiData.additionalStreetAddress || '',
          buildingNumber: apiData.buildingNumber || '',
          plotIdentification: apiData.plotIdentification || '',
          citySubDivisionName: apiData.citySubDivisionName || '',
          city: apiData.city || '',
          postCode: apiData.postCode || '',
          countrySubEntity: apiData.countrySubEntity || '',
          country: apiData.country || '',
          countryCode: apiData.countryCode || '',
        },
      }));
    } else if (profileData?.isError) {
      _formData({ ...INITIAL_FORM_DATA });
    }
  }, [profileData]);

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

  const handleSubmitForm = (e) => {
    if (e) e.preventDefault();
    if (handleValidateForm()) {
      _isLoading(true);

      const payload = { ...formData.data };

      const request = id
        ? CompanyProfileUpdateRequest(decodedToken, id, JSON.stringify(payload))
        : CompanyProfileCreateRequest(decodedToken, JSON.stringify(payload));

      request
        .then(() => {
          showToast(id ? 'Company profile updated successfully!' : 'Company profile created successfully!', 'success');
          navigate('/company-profile');
        })
        .catch((err) => {
          showToast(err?.message || (id ? 'Failed to update company profile' : 'Failed to create company profile'), 'error');
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
          {id ? 'Edit Company Profile' : 'Create Company Profile'}
        </h1>
      </div>
    </div>
  );

  const BASIC_INFO_SECTION = () => (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Profile Name *</label>
          <input
            type="text"
            name="profileName"
            value={formData.data.profileName}
            onChange={handleChangeFormData}
            placeholder="FB01"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.profileName && (
            <span className="text-xs text-tomato">{formData.errors.profileName}</span>
          )}
        </div>

        {/* Company Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Company Name *</label>
          <input
            type="text"
            name="companyName"
            value={formData.data.companyName}
            onChange={handleChangeFormData}
            placeholder="Saudia Private Aviation Co. Ltd"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.companyName && (
            <span className="text-xs text-tomato">{formData.errors.companyName}</span>
          )}
        </div>

        {/* Company Arabic Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Company Arabic Name</label>
          <input
            type="text"
            name="companyArabicName"
            value={formData.data.companyArabicName}
            onChange={handleChangeFormData}
            placeholder="شركة الخطوط السعودية للرحلات الخاصة المحدودة"
            dir="rtl"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.data.email}
            onChange={handleChangeFormData}
            placeholder="ar@spa.sa"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.email && (
            <span className="text-xs text-tomato">{formData.errors.email}</span>
          )}
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Phone *</label>
          <input
            type="text"
            name="phone"
            value={formData.data.phone}
            onChange={handleChangeFormData}
            placeholder="+966 11 234 5678"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.phone && (
            <span className="text-xs text-tomato">{formData.errors.phone}</span>
          )}
        </div>

        {/* Invoice Type */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Invoice Type *</label>
          <input
            type="text"
            name="invoiceType"
            value={formData.data.invoiceType}
            onChange={handleChangeFormData}
            placeholder="FB01"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.invoiceType && (
            <span className="text-xs text-tomato">{formData.errors.invoiceType}</span>
          )}
        </div>

        {/* CRN Number */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">CRN Number *</label>
          <input
            type="text"
            name="crnNumber"
            value={formData.data.crnNumber}
            onChange={handleChangeFormData}
            placeholder="4030182668"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.crnNumber && (
            <span className="text-xs text-tomato">{formData.errors.crnNumber}</span>
          )}
        </div>

        {/* VAT Number */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">VAT Number *</label>
          <input
            type="text"
            name="vatNumber"
            value={formData.data.vatNumber}
            onChange={handleChangeFormData}
            placeholder="300000776210003"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.vatNumber && (
            <span className="text-xs text-tomato">{formData.errors.vatNumber}</span>
          )}
        </div>

        {/* Branch Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Branch Name *</label>
          <input
            type="text"
            name="branchName"
            value={formData.data.branchName}
            onChange={handleChangeFormData}
            placeholder="Aviation"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* Branch Industry */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Branch Industry</label>
          <input
            type="text"
            name="branchIndustry"
            value={formData.data.branchIndustry}
            onChange={handleChangeFormData}
            placeholder="Aviation"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* Payment Terms */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Payment Terms</label>
          <input
            type="text"
            name="paymentTerms"
            value={formData.data.paymentTerms}
            onChange={handleChangeFormData}
            placeholder="30 days"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Notes</label>
          <input
            type="text"
            name="notes"
            value={formData.data.notes}
            onChange={handleChangeFormData}
            placeholder="Header / Footer notes"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
      </div>
    </section>
  );

  const BANK_DETAILS_SECTION = () => (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-[#0d121b] dark:text-white text-sm font-medium rounded-lg">
          Bank Details
        </button>
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-[#0d121b] dark:text:white text-sm font-medium rounded-lg">
          Bank Details USD
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bank Details SAR */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">
            Bank Details *
          </label>
          <textarea
            name="bankDetailsSar"
            value={formData.data.bankDetailsSar}
            onChange={handleChangeFormData}
            rows={4}
            placeholder="Bank Name: ...&#10;Account Name: ...&#10;IBAN: ..."
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-y"
          />
          {formData.errors.bankDetailsSar && (
            <span className="text-xs text-tomato">{formData.errors.bankDetailsSar}</span>
          )}
        </div>

        {/* Bank Details USD */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            Bank Details USD *
          </label>
          <textarea
            name="bankDetailsUsd"
            value={formData.data.bankDetailsUsd}
            onChange={handleChangeFormData}
            rows={4}
            placeholder="Bank Name: ...&#10;Account Name: ...&#10;IBAN: ..."
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-y"
          />
          {formData.errors.bankDetailsUsd && (
            <span className="text-xs text-tomato">{formData.errors.bankDetailsUsd}</span>
          )}
        </div>
      </div>
    </section>
  );

  const ADDRESS_DETAILS_SECTION = () => (
    <section className="space-y-6">
      <div className="flex items-center gap-2 pb-2">
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-[#0d121b] dark:text:white text-sm font-medium rounded-lg">
          Address Details
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full Address */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            Full Address
          </label>
          <input
            type="text"
            name="fullAddress"
            value={formData.data.fullAddress}
            onChange={handleChangeFormData}
            placeholder="P O Box 620, 21231 JEDDAH"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg:white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* Full Address Arabic */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            Full Address Arabic
          </label>
          <input
            type="text"
            name="fullAddressArabic"
            value={formData.data.fullAddressArabic}
            onChange={handleChangeFormData}
            placeholder="ص ب 620، 21231 جدة"
            dir="rtl"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg:white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* Street */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            Street
          </label>
          <input
            type="text"
            name="street"
            value={formData.data.street}
            onChange={handleChangeFormData}
            placeholder="King Abdulaziz International Airport"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg:white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus;border-primary transition-colors"
          />
        </div>

        {/* Additional Street Address */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            Additional Street Address
          </label>
          <input
            type="text"
            name="additionalStreetAddress"
            value={formData.data.additionalStreetAddress}
            onChange={handleChangeFormData}
            placeholder="-"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark;border-[#2a3447] bg:white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus;border-primary transition-colors"
          />
        </div>

        {/* Building Number */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            Building Number
          </label>
          <input
            type="text"
            name="buildingNumber"
            value={formData.data.buildingNumber}
            onChange={handleChangeFormData}
            placeholder="7706"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark;border-[#2a3447] bg:white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus;border-primary transition-colors"
          />
        </div>

        {/* Plot Identification */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            Plot Identification
          </label>
          <input
            type="text"
            name="plotIdentification"
            value={formData.data.plotIdentification}
            onChange={handleChangeFormData}
            placeholder="13447"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark;border-[#2a3447] bg:white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus;border-primary transition-colors"
          />
        </div>

        {/* Post Code */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            Post Code
          </label>
          <input
            type="text"
            name="postCode"
            value={formData.data.postCode}
            onChange={handleChangeFormData}
            placeholder="23721"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark;border-[#2a3447] bg:white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus;border-primary transition-colors"
          />
        </div>

        {/* City Sub Division Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            City Sub Division Name
          </label>
          <input
            type="text"
            name="citySubDivisionName"
            value={formData.data.citySubDivisionName}
            onChange={handleChangeFormData}
            placeholder="-"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark;border-[#2a3447] bg:white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus;border-primary transition-colors"
          />
        </div>

        {/* City */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            City *
          </label>
          <input
            type="text"
            name="city"
            value={formData.data.city}
            onChange={handleChangeFormData}
            placeholder="Jeddah"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark;border-[#2a3447] bg:white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus;border-primary transition-colors"
          />
          {formData.errors.city && (
            <span className="text-xs text-tomato">{formData.errors.city}</span>
          )}
        </div>

        {/* Country Sub Entity */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            Country Sub Entity
          </label>
          <input
            type="text"
            name="countrySubEntity"
            value={formData.data.countrySubEntity}
            onChange={handleChangeFormData}
            placeholder="-"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark;border-[#2a3447] bg:white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus;border-primary transition-colors"
          />
        </div>

        {/* Country */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            Country *
          </label>
          <select
            name="country"
            value={formData.data.country}
            onChange={handleChangeFormData}
            className="px-4 py-2.5 pr-10 rounded-lg border border-[#e7ebf3] dark;border-[#2a3447] bg:white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus;border-primary transition-colors appearance-none"
          >
            <option value="">Country</option>
            <option value="SA">Saudi Arabia</option>
          </select>
          {formData.errors.country && (
            <span className="text-xs text-tomato">{formData.errors.country}</span>
          )}
        </div>

        {/* Country Code */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text:white">
            Country Code *
          </label>
          <input
            type="text"
            name="countryCode"
            value={formData.data.countryCode}
            onChange={handleChangeFormData}
            placeholder="SA"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark;border-[#2a3447] bg:white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text:white focus:ring-2 focus:ring-primary focus;border-primary transition-colors"
          />
          {formData.errors.countryCode && (
            <span className="text-xs text-tomato">{formData.errors.countryCode}</span>
          )}
        </div>
      </div>
    </section>
  );

  const FORM_ACTIONS = () => (
    <div className="flex gap-3 pt-6">
      <button
        type="submit"
        disabled={isLoading || profileData?.isError}
        onClick={handleSubmitForm}
        className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'SAVING...' : 'SAVE'}
      </button>
      <button
        type="button"
        onClick={() => navigate('/company-profile')}
        className="px-6 py-2.5 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors"
      >
        CANCEL
      </button>
    </div>
  );

  const FORM_CONTENT = () => (
    <form className="p-6 space-y-8" onSubmit={handleSubmitForm}>
      {BASIC_INFO_SECTION()}
      {BANK_DETAILS_SECTION()}
      {ADDRESS_DETAILS_SECTION()}
      {FORM_ACTIONS()}
    </form>
  );

  const COMPANY_PROFILE_FORM = () => (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark;border-[#2a3447] overflow-hidden">
      {FORM_CONTENT()}
    </div>
  );

  const MAIN_GRID = () => (
    <div className="grid grid-cols-1 gap-8">
      <div className="lg:col-span-12">{COMPANY_PROFILE_FORM()}</div>
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

export default CompanyProfileForm;
