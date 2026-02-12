// Packages
import { Fragment, useState, use, useMemo, useEffect, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';

// APIs
import { CustomerCreateRequest, CustomerDetailRequest, CustomerUpdateRequest } from '../../../requests';

// Utils
import { auth } from '../../../atoms';
import { Footer, ErrorFallback } from '../../../components';
import { showToast, validateSubmissionData, decodeString } from '../../../utils';

const INITIAL_FORM_DATA = {
  data: {
    registrationName: '',
    registrationNameAr: '',
    email: '',
    phone: '',
    customerVAT: '',
    address: '',
    addressAr: '',
    streetName: '',
    streetNameAr: '',
    buildingNumber: '',
    citySubDivisionName: '',
    citySubDivisionNameAr: '',
    cityName: '',
    cityNameAr: '',
    postalZone: '',
    countryCode: '',
  },
  validations: {
    streetName: { isRequired: true, label: 'Street Name' },
    streetNameAr: { isRequired: true, label: 'Street Name (Arabic)' },
    address: { isRequired: true, label: 'Full Address' },
    addressAr: { isRequired: true, label: 'Full Address (Arabic)' },
    buildingNumber: { isRequired: true, label: 'Building Number' },
    cityName: { isRequired: true, label: 'City Name' },
    cityNameAr: { isRequired: true, label: 'City Name (Arabic)' },
    postalZone: { isRequired: true, min: 5, label: 'Postal Zone' },
    countryCode: { isRequired: true, label: 'Country Code' },
    customerVAT: { isRequired: true, label: 'Customer VAT' },
    registrationName: { isRequired: true, label: 'Registered Name' },
    registrationNameAr: { isRequired: true, label: 'Registered Name (Arabic)' },
    email: {
      isRequired: true,
      regex: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      label: 'Email',
    },
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

  // *********** Render Functions ***********
  const CONTENT = () => (
    <Fragment>
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
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
      </ErrorBoundary>
    </Fragment>
  );

  return (
    <div id="customer-form">
      {CONTENT()}
    </div>
  );
}

function CustomerFormContent({ id, customerPromise, decodedToken, navigate }) {
  const customerData = customerPromise ? use(customerPromise) : null;
  const [formData, _formData] = useState({ ...INITIAL_FORM_DATA });
  const [isLoading, _isLoading] = useState(false);

  useEffect(() => {
    if (customerData?.data) {
      const apiData = customerData.data;
      _formData(old => ({
        ...old,
        data: {
          ...old.data,
          registrationName: apiData.registrationName || '',
          registrationNameAr: apiData.registrationNameAr || '',
          email: apiData.email || '',
          phone: apiData.phone || '',
          customerVAT: apiData.customerVAT || '',
          address: apiData.address || '',
          addressAr: apiData.addressAr || '',
          streetName: apiData.streetName || '',
          streetNameAr: apiData.streetNameAr || '',
          buildingNumber: apiData.buildingNumber || '',
          citySubDivisionName: apiData.citySubdivisionName || '',
          citySubDivisionNameAr: apiData.citySubdivisionNameAr || '',
          cityName: apiData.cityName || '',
          cityNameAr: apiData.cityNameAr || '',
          postalZone: apiData.postalZone || '',
          countryCode: apiData.countryCode || '',
        },
      }));
    } else if (customerData?.isError) {
      _formData({ ...INITIAL_FORM_DATA });
    }
  }, [customerData]);

  // *********** Handlers ***********
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
        streetNameAr: formData.data.streetNameAr,
        address: formData.data.address,
        addressAr: formData.data.addressAr,
        buildingNumber: formData.data.buildingNumber,
        citySubdivisionName: formData.data.citySubDivisionName,
        citySubdivisionNameAr: formData.data.citySubDivisionNameAr,
        cityName: formData.data.cityName,
        cityNameAr: formData.data.cityNameAr,
        postalZone: formData.data.postalZone,
        countryCode: formData.data.countryCode,
        customerVAT: formData.data.customerVAT,
        registrationName: formData.data.registrationName,
        registrationNameAr: formData.data.registrationNameAr,
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

  // *********** Render Functions ***********
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
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Registered Name (Arabic)</label>
          <input
            type="text"
            name="registrationNameAr"
            value={formData.data.registrationNameAr || ''}
            onChange={handleChangeFormData}
            placeholder="شركة أحمد السعود"
            dir="rtl"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.registrationNameAr && (
            <span className="text-xs text-tomato">{formData.errors.registrationNameAr}</span>
          )}
        </div>

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
            name="address"
            value={formData.data.address || ''}
            onChange={handleChangeFormData}
            placeholder="Building 1234, Prince Sultan Street, Riyadh"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.address && (
            <span className="text-xs text-tomato">{formData.errors.address}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Full Address (Arabic)</label>
          <input
            type="text"
            name="addressAr"
            value={formData.data.addressAr || ''}
            onChange={handleChangeFormData}
            placeholder="مبنى 1234، شارع الأمير سلطان، الرياض"
            dir="rtl"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.addressAr && (
            <span className="text-xs text-tomato">{formData.errors.addressAr}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Street Name</label>
          <input
            type="text"
            name="streetName"
            value={formData.data.streetName || ''}
            onChange={handleChangeFormData}
            placeholder="Prince Sultan Street"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.streetName && (
            <span className="text-xs text-tomato">{formData.errors.streetName}</span>
          )}
        </div>

        {/* Row 2 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Street Name (Arabic)</label>
          <input
            type="text"
            name="streetNameAr"
            value={formData.data.streetNameAr || ''}
            onChange={handleChangeFormData}
            placeholder="شارع الأمير سلطان"
            dir="rtl"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.streetNameAr && (
            <span className="text-xs text-tomato">{formData.errors.streetNameAr}</span>
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
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">City Subdivision Name</label>
          <input
            type="text"
            name="citySubDivisionName"
            value={formData.data.citySubDivisionName || ''}
            onChange={handleChangeFormData}
            placeholder="District 5"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.citySubDivisionName && (
            <span className="text-xs text-tomato">{formData.errors.citySubDivisionName}</span>
          )}
        </div>

        {/* Row 3 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">City Subdivision Name (Arabic)</label>
          <input
            type="text"
            name="citySubDivisionNameAr"
            value={formData.data.citySubDivisionNameAr || ''}
            onChange={handleChangeFormData}
            placeholder="الحي الخامس"
            dir="rtl"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.citySubDivisionNameAr && (
            <span className="text-xs text-tomato">{formData.errors.citySubDivisionNameAr}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">City Name *</label>
          <input
            type="text"
            name="cityName"
            value={formData.data.cityName || ''}
            onChange={handleChangeFormData}
            placeholder="Riyadh"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.cityName && (
            <span className="text-xs text-tomato">{formData.errors.cityName}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">City Name (Arabic)</label>
          <input
            type="text"
            name="cityNameAr"
            value={formData.data.cityNameAr || ''}
            onChange={handleChangeFormData}
            placeholder="الرياض"
            dir="rtl"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {formData.errors.cityNameAr && (
            <span className="text-xs text-tomato">{formData.errors.cityNameAr}</span>
          )}
        </div>

        {/* Row 4 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0d121b] dark:text-white">Postal Zone *</label>
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
