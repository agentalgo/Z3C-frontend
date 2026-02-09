// Packages
import { Fragment, useState, use, useMemo, useEffect, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';

// APIs
import { CustomerCreateRequest, CustomerDetailRequest, CustomerUpdateRequest } from '../../../requests';

// Utils
import { auth } from '../../../atoms';
import { Footer } from '../../../components';
import { showToast, validateSubmissionData, decodeString } from '../../../utils';

const INITIAL_FORM_DATA = {
  data: {
    arabicName: '',
    registrationName: '',
    email: '',
    phone: '',
    customerReferenceCode: '',
    customerVAT: '',
    customerCrn: '',
    companyProfile: '',
    fullAddress: '',
    fullAddressArabic: '',
    streetName: '',
    additionalStreetAddress: '',
    buildingNumber: '',
    plotIdentification: '',
    citySubDivisionName: '',
    city: '',
    postalZone: '',
    countrySubEntity: '',
    country: '',
    countryCode: '',
  },
  validations: {
    postalZone: { isRequired: true, min: 5, label: 'Postal Zone' },
    registrationName: { isRequired: true, label: 'Registered Name' },
    companyProfile: { isRequired: true, label: 'Company Profile' },
    city: { isRequired: true, label: 'City' },
    country: { isRequired: true, label: 'Country' },
    countryCode: { isRequired: true, label: 'Country Code' },
    email: { regex: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, label: 'Email' },
  },
  errors: {},
};

function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authValue = useAtomValue(auth);
  const decodedToken = useMemo(() => decodeString(authValue), [authValue]);

  const customerPromise = useMemo(() => {
    if (id) {
      return CustomerDetailRequest(decodedToken, id).catch((err) => {
        console.error('Failed to fetch customer details:', err);
        return { data: null, isError: true };
      });
    }
    return null;
  }, [id, decodedToken]);

  return (
    <Fragment>
      <Suspense fallback={
        <div className="p-8 flex items-center justify-center">
          <div className="flex items-center gap-2 text-[#4c669a]">
            <span className="material-symbols-outlined animate-spin">sync</span>
            Loading customer details...
          </div>
        </div>
      }>
        <CustomerFormContent
          id={id}
          customerPromise={customerPromise}
          decodedToken={decodedToken}
          navigate={navigate}
        />
      </Suspense>
    </Fragment>
  );
}

function CustomerFormContent({ id, customerPromise, decodedToken, navigate }) {
  const customerData = customerPromise ? use(customerPromise) : null;
  const [formData, _formData] = useState({ ...INITIAL_FORM_DATA });
  const [isLoading, _isLoading] = useState(false);

  useEffect(() => {
    if (customerData?.data) {
      const { firstName, lastName, ...rest } = customerData.data; // Cleaning up just in case, though they should be gone from payload
      _formData(old => ({
        ...old,
        data: {
          ...old.data,
          ...customerData.data,
          city: customerData.data.cityName || '', // Map cityName to city if needed
        },
      }));
    } else if (customerData?.isError) {
      _formData({ ...INITIAL_FORM_DATA });
    }
  }, [customerData]);

  /********  handlers  ********/
  const handleChangeFormData = (e) => {
    _formData(old => ({
      ...old,
      data: {
        ...old.data,
        [e.target.name]: e.target.value,
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
    e.preventDefault();
    if (handleValidateForm()) {
      _isLoading(true);

      const payloadData = {
        streetName: formData.data.streetName,
        buildingNumber: formData.data.buildingNumber,
        citySubdivisionName: formData.data.citySubDivisionName,
        cityName: formData.data.city,
        postalZone: formData.data.postalZone,
        countryCode: formData.data.countryCode,
        customerVAT: formData.data.customerVAT,
        registrationName: formData.data.registrationName,
        email: formData.data.email,
        phone: formData.data.phone
      };

      const request = id
        ? CustomerUpdateRequest(decodedToken, id, JSON.stringify(payloadData))
        : CustomerCreateRequest(decodedToken, JSON.stringify(payloadData));

      request
        .then(() => {
          showToast(id ? 'Customer updated successfully!' : 'Customer created successfully!', 'success');
          navigate('/customer');
        })
        .catch((err) => {
          showToast(err?.message || (id ? 'Failed to update customer' : 'Failed to create customer'), 'error');
        })
        .finally(() => {
          _isLoading(false);
        });
    } else {
      showToast('Please fill in all required fields', 'error');
    }
  };

  /********  Render functions  ********/
  const PAGE_HEADER = () => (
    <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[#0d121b] dark:text-white text-3xl font-black leading-tight">
          {id ? 'Edit Customer' : 'Create Customer'}
        </h1>
      </div>
    </div>
  );

  const BASIC_INFO_SECTION = () => (
    <section className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Registered Name *</label>
          <input
            type="text"
            name="registrationName"
            value={formData.data.registrationName || ''}
            onChange={handleChangeFormData}
            placeholder="Ahmed Al-Saud Trading Co."
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.registrationName && (
            <span className="text-xs text-tomato">{formData.errors.registrationName}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Arabic Name</label>
          <input
            type="text"
            name="arabicName"
            value={formData.data.arabicName || ''}
            onChange={handleChangeFormData}
            placeholder="أحمد السعود"
            dir="rtl"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.arabicName && (
            <span className="text-xs text-tomato">{formData.errors.arabicName}</span>
          )}
        </div>

        {/* Same row as Registered Name and Customer CRN */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Email</label>
          <input
            type="email"
            name="email"
            value={formData.data.email || ''}
            onChange={handleChangeFormData}
            placeholder="ahmed@customer.sa"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.email && (
            <span className="text-xs text-tomato">{formData.errors.email}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Phone</label>
          <input
            type="text"
            name="phone"
            value={formData.data.phone || ''}
            onChange={handleChangeFormData}
            placeholder="+966 11 234 5678"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.phone && (
            <span className="text-xs text-tomato">{formData.errors.phone}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Customer Reference Code</label>
          <input
            type="text"
            name="customerReferenceCode"
            value={formData.data.customerReferenceCode || ''}
            onChange={handleChangeFormData}
            placeholder="REF-001"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.customerReferenceCode && (
            <span className="text-xs text-tomato">{formData.errors.customerReferenceCode}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Customer CRN</label>
          <input
            type="text"
            name="customerCrn"
            value={formData.data.customerCrn || ''}
            onChange={handleChangeFormData}
            placeholder="1010123456"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.customerCrn && (
            <span className="text-xs text-tomato">{formData.errors.customerCrn}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Customer VAT</label>
          <input
            type="text"
            name="customerVAT"
            value={formData.data.customerVAT || ''}
            onChange={handleChangeFormData}
            placeholder="300012345600003"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.customerVAT && (
            <span className="text-xs text-tomato">{formData.errors.customerVAT}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Company Profile *</label>
          <div className="relative">
            <select
              name="companyProfile"
              value={formData.data.companyProfile || ''}
              onChange={handleChangeFormData}
              className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none"
            >
              <option value="">Select a profile...</option>
              <option value="Fl3xx">Fl3xx</option>
              <option value="FB01">FB01</option>
              <option value="MR02">MR02</option>
              <option value="SM03">SM03</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[20px] text-[#4c669a] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
          {formData.errors.companyProfile && (
            <span className="text-xs text-tomato">{formData.errors.companyProfile}</span>
          )}
        </div>
      </div>
    </section >
  );

  const ADDRESS_DETAILS_SECTION = () => (
    <section className="space-y-6">
      <div className="flex items-center gap-2 pb-2">
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-[#0d121b] dark:text-white text-sm font-medium rounded-lg">
          Address Details
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Row 1 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Full Address</label>
          <input
            type="text"
            name="fullAddress"
            value={formData.data.fullAddress || ''}
            onChange={handleChangeFormData}
            placeholder="King Fahd Road, Al Olaya District"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.fullAddress && (
            <span className="text-xs text-tomato">{formData.errors.fullAddress}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Full Address Arabic</label>
          <input
            type="text"
            name="fullAddressArabic"
            value={formData.data.fullAddressArabic || ''}
            onChange={handleChangeFormData}
            placeholder="طريق الملك فهد، حي العليا"
            dir="rtl"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.fullAddressArabic && (
            <span className="text-xs text-tomato">{formData.errors.fullAddressArabic}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Street</label>
          <input
            type="text"
            name="streetName"
            value={formData.data.streetName || ''}
            onChange={handleChangeFormData}
            placeholder="King Fahd Road"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.streetName && (
            <span className="text-xs text-tomato">{formData.errors.streetName}</span>
          )}
        </div>

        {/* Row 2 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Additional Street Address</label>
          <input
            type="text"
            name="additionalStreetAddress"
            value={formData.data.additionalStreetAddress || ''}
            onChange={handleChangeFormData}
            placeholder="Near City Center"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.additionalStreetAddress && (
            <span className="text-xs text-tomato">{formData.errors.additionalStreetAddress}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Building Number</label>
          <input
            type="text"
            name="buildingNumber"
            value={formData.data.buildingNumber || ''}
            onChange={handleChangeFormData}
            placeholder="1234"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.buildingNumber && (
            <span className="text-xs text-tomato">{formData.errors.buildingNumber}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Plot Identification</label>
          <input
            type="text"
            name="plotIdentification"
            value={formData.data.plotIdentification || ''}
            onChange={handleChangeFormData}
            placeholder="Plot 5678"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.plotIdentification && (
            <span className="text-xs text-tomato">{formData.errors.plotIdentification}</span>
          )}
        </div>

        {/* Row 3 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">City Sub Division Name</label>
          <input
            type="text"
            name="citySubDivisionName"
            value={formData.data.citySubDivisionName || ''}
            onChange={handleChangeFormData}
            placeholder="Al Olaya District"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.citySubDivisionName && (
            <span className="text-xs text-tomato">{formData.errors.citySubDivisionName}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">City *</label>
          <input
            type="text"
            name="city"
            value={formData.data.city || ''}
            onChange={handleChangeFormData}
            placeholder="Riyadh"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.city && (
            <span className="text-xs text-tomato">{formData.errors.city}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Post Code</label>
          <input
            type="text"
            name="postalZone"
            value={formData.data.postalZone || ''}
            onChange={handleChangeFormData}
            placeholder="12345"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.postalZone && (
            <span className="text-xs text-tomato">{formData.errors.postalZone}</span>
          )}
        </div>

        {/* Row 4 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Country Sub Entity</label>
          <input
            type="text"
            name="countrySubEntity"
            value={formData.data.countrySubEntity || ''}
            onChange={handleChangeFormData}
            placeholder="Riyadh Region"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.countrySubEntity && (
            <span className="text-xs text-tomato">{formData.errors.countrySubEntity}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Country *</label>
          <div className="relative">
            <select
              name="country"
              value={formData.data.country || ''}
              onChange={handleChangeFormData}
              className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none"
            >
              <option value="">Select a country...</option>
              <option value="SA">Saudi Arabia</option>
              <option value="AE">United Arab Emirates</option>
              <option value="KW">Kuwait</option>
              <option value="QA">Qatar</option>
              <option value="BH">Bahrain</option>
              <option value="OM">Oman</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[20px] text-[#4c669a] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
          {formData.errors.country && (
            <span className="text-xs text-tomato">{formData.errors.country}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Country Code *</label>
          <input
            type="text"
            name="countryCode"
            value={formData.data.countryCode || ''}
            onChange={handleChangeFormData}
            placeholder="SA"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
        disabled={isLoading || customerData?.isError}
        onClick={handleSubmitForm}
        className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px]"
      >
        {isLoading ? 'SAVING...' : 'SAVE'}
      </button>
      <button
        type="button"
        onClick={() => navigate('/customer')}
        className="px-6 py-2.5 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors"
      >
        CANCEL
      </button>
    </div>
  );

  const FORM_CONTENT = () => (
    <div className="p-6 space-y-8">
      {BASIC_INFO_SECTION()}
      {ADDRESS_DETAILS_SECTION()}
      {FORM_ACTIONS()}
    </div>
  );

  const CUSTOMER_FORM = () => (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden">
      {FORM_CONTENT()}
    </div>
  );

  const MAIN_GRID = () => (
    <div className="grid grid-cols-1 gap-8">
      <div className="lg:col-span-12">
        {CUSTOMER_FORM()}
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

export default CustomerForm;
