// Packages
import { Fragment, useState, useMemo, Suspense, use, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { useAtomValue } from 'jotai';

// APIs
import { InvoiceCreateRequest, InvoiceDetailRequest, InvoiceUpdateRequest, InvoiceSubmitToZatcaRequest, CustomerListRequest } from '../../../requests';

// Utils
import { Footer, ErrorFallback } from '../../../components';
import { showToast, validateSubmissionData, decodeString } from '../../../utils';
import { auth } from '../../../atoms';

const INITIAL_FORM_DATA = {
  data: {
    invoiceNumber: '',
    invoiceType: '',
    customerId: null,
    referenceNumber: '',
    paymentType: '',
    paymentTerms: '',
    customerCategory: 'corporate',
    dueDate: '',
    deliveryDate: '',
    // Customer fields (matched with registration fields)
    registrationName: '',
    registrationNameAr: '',
    email: '',
    phone: '',
    customerVAT: '',
    streetName: '',
    streetNameAr: '',
    address: '',
    addressAr: '',
    buildingNumber: '',
    citySubdivisionName: '',
    citySubdivisionNameAr: '',
    cityName: '',
    cityNameAr: '',
    postalZone: '',
    countryCode: 'SA',
    // Note
    note: '',
  },
  validations: {
    referenceNumber: { isRequired: true, label: 'Reference Number' },
    customerId: { isRequired: true, label: 'Customer' },
    paymentTerms: { isRequired: true, label: 'Payment Terms' },
    deliveryDate: { isRequired: true, label: 'Delivery Date' }
  },
  errors: {},
};

const INITIAL_LINE_ITEM = {
  description: '',
  productCode: '',
  quantity: 1,
  price: '',
  discount_amount: 0,
  discount_percentage: 0,
  taxExempt: false,
  taxExemptReason: '',
};

function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authValue = useAtomValue(auth);
  const decodedToken = useMemo(() => decodeString(authValue), [authValue]);

  // *********** Render Functions ***********
  const invoicePromise = useMemo(() => {
    if (id) {
      return InvoiceDetailRequest(decodedToken, id).catch((err) => {
        console.error('Failed to fetch invoice details:', err);
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
              Loading invoice details...
            </div>
          </div>
        }>
          <InvoiceFormContent
            id={id}
            invoicePromise={invoicePromise}
            decodedToken={decodedToken}
            navigate={navigate}
          />
        </Suspense>
      </ErrorBoundary>
    </Fragment>
  );

  return (
    <div id="invoice-form">
      {CONTENT()}
    </div>
  );
}

function InvoiceFormContent({ id, invoicePromise, decodedToken, navigate }) {
  const invoiceData = invoicePromise ? use(invoicePromise) : null;
  const [formData, _formData] = useState({ ...INITIAL_FORM_DATA });
  const [isLoading, _isLoading] = useState(false);
  const [lineItems, _lineItems] = useState([]);

  useEffect(() => {
    if (invoiceData?.data) {
      const apiData = invoiceData.data;
      const customer = apiData.customerId || {};

      _formData(old => ({
        ...old,
        data: {
          ...old.data,
          invoiceNumber: apiData.invoiceNumber || '',
          invoiceType: apiData.invoiceType?.toLowerCase() || '',
          referenceNumber: apiData.referenceNumber || '',
          paymentType: apiData.paymentType || '',
          paymentTerms: apiData.paymentTerms || '',
          dueDate: apiData.dueDate ? new Date(apiData.dueDate).toISOString().split('T')[0] : '',
          deliveryDate: apiData.deliveryDate ? new Date(apiData.deliveryDate).toISOString().split('T')[0] : '',
          // Customer fields from nested customerId object
          customerId: customer._id ? String(customer._id) : null,
          registrationName: customer.registrationName || '',
          registrationNameAr: customer.registrationNameAr || '',
          email: customer.email || '',
          phone: customer.phone || '',
          customerVAT: customer.customerVAT || '',
          address: customer.address || '',
          addressAr: customer.addressAr || '',
          streetName: customer.streetName || '',
          streetNameAr: customer.streetNameAr || '',
          buildingNumber: customer.buildingNumber || '',
          citySubdivisionName: customer.citySubdivisionName || '',
          citySubdivisionNameAr: customer.citySubdivisionNameAr || '',
          cityName: customer.cityName || '',
          cityNameAr: customer.cityNameAr || '',
          postalZone: customer.postalZone || '',
          countryCode: customer.countryCode || 'SA',
          note: apiData.note || '',
        },
      }));

      if (apiData.lineItems) {
        _lineItems(apiData.lineItems.map(item => ({
          description: item.description || '',
          productCode: item.productCode || '',
          quantity: item.quantity || 1,
          price: item.price || 0,
          discount_amount: item.discount_amount || 0,
          discount_percentage: item.discount_percentage || 0,
          taxExempt: item.taxExempt || false,
          taxExemptReason: item.taxExemptReason || '',
        })));
      }
    } else if (invoiceData?.isError) {
      _formData({ ...INITIAL_FORM_DATA });
      _lineItems([]);
    }
  }, [invoiceData]);

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

  const handleCustomerChange = (selectedOption) => {
    if (selectedOption) {
      const customer = selectedOption.data;
      _formData((old) => ({
        ...old,
        data: {
          ...old.data,
          customerId: String(customer._id || customer.id || ''),
          registrationName: customer.registrationName || '',
          registrationNameAr: customer.registrationNameAr || '',
          email: customer.email || '',
          phone: customer.phone || '',
          customerVAT: customer.customerVAT || '',
          streetName: customer.streetName || '',
          streetNameAr: customer.streetNameAr || '',
          address: customer.address || '',
          addressAr: customer.addressAr || '',
          buildingNumber: customer.buildingNumber || '',
          citySubdivisionName: customer.citySubdivisionName || '',
          citySubdivisionNameAr: customer.citySubdivisionNameAr || '',
          cityName: customer.cityName || '',
          cityNameAr: customer.cityNameAr || '',
          postalZone: customer.postalZone || '',
          countryCode: customer.countryCode || 'SA',
        },
      }));
    } else {
      _formData((old) => ({
        ...old,
        data: {
          ...old.data,
          customerId: null,
          registrationName: '',
          registrationNameAr: '',
          email: '',
          phone: '',
          customerVAT: '',
          streetName: '',
          streetNameAr: '',
          address: '',
          addressAr: '',
          buildingNumber: '',
          citySubdivisionName: '',
          citySubdivisionNameAr: '',
          cityName: '',
          cityNameAr: '',
          postalZone: '',
          countryCode: 'SA',
        },
      }));
    }
  };

  const loadCustomerOptions = (inputValue) => {
    return CustomerListRequest(decodedToken, { limit: 1000, search: inputValue })
      .then((response) => {
        return response.data.map((customer) => ({
          value: customer.id,
          label: customer.registrationName,
          data: customer,
        }));
      })
      .catch((error) => {
        console.error('Error loading customers:', error);
        return [];
      });
  };

  const handleValidateForm = () => {
    const { allValid, errors } = validateSubmissionData(
      formData.data,
      formData.validations
    );

    const validationErrors = { ...errors };
    let isValid = allValid;

    // Validate lineItems array
    if (!lineItems || lineItems.length === 0) {
      validationErrors.lineItems = 'Line items should not be empty';
      isValid = false;
    }

    if (!isValid) {
      _formData((old) => ({
        ...old,
        errors: validationErrors,
      }));
    } else {
      _formData((old) => ({
        ...old,
        errors: {},
      }));
    }

    return isValid;
  };

  const handleSubmitForm = (e) => {
    if (e) e.preventDefault();
    if (handleValidateForm()) {
      _isLoading(true);

      const payloadData = {
        referenceNumber: formData.data.referenceNumber,
        customerId: String(formData.data.customerId || ''),
        paymentType: formData.data.paymentType || 'CASH',
        paymentTerms: formData.data.paymentTerms,
        deliveryDate: formData.data.deliveryDate,
        currency: 'SAR',
        lineItems: lineItems.map((item) => ({
          description: item.description,
          productCode: item.productCode,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          discount_amount: Number(item.discount_amount) || 0,
          discount_percentage: Number(item.discount_percentage) || 0,
          taxExempt: !!item.taxExempt,
          taxExemptReason: item.taxExemptReason || '',
        })),
        vat: 15,
        note: formData.data.note,
      };

      const request = id
        ? InvoiceUpdateRequest(decodedToken, id, JSON.stringify(payloadData))
        : InvoiceCreateRequest(decodedToken, JSON.stringify(payloadData));

      request
        .then(() => {
          showToast(id ? 'Invoice updated successfully!' : 'Invoice created successfully!', 'success');
          navigate('/invoices');
        })
        .catch((err) => {
          showToast(err?.message || (id ? 'Failed to update invoice' : 'Failed to create invoice'), 'error');
        })
        .finally(() => {
          _isLoading(false);
        });
    } else {
      showToast('Please fill in all required fields', 'error');
    }
  };

  const handleCreateAndSubmitToZatca = async () => {
    if (!handleValidateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (isLoading) {
      showToast('Please wait for the previous request to complete', 'error');
      return;
    }
    try {
      _isLoading(true);
      const payloadData = {
        referenceNumber: formData.data.referenceNumber,
        customerId: String(formData.data.customerId || ''),
        paymentType: formData.data.paymentType || 'CASH',
        paymentTerms: formData.data.paymentTerms,
        deliveryDate: formData.data.deliveryDate,
        currency: 'SAR',
        lineItems: lineItems.map((item) => ({
          description: item.description,
          productCode: item.productCode,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          discount_amount: Number(item.discount_amount) || 0,
          discount_percentage: Number(item.discount_percentage) || 0,
          taxExempt: !!item.taxExempt,
          taxExemptReason: item.taxExemptReason || '',
        })),
        vat: 15,
        note: formData.data.note,
      };

      const response = await InvoiceCreateRequest(decodedToken, JSON.stringify(payloadData));
      const createdInvoiceId =
        response?.data?._id ||
        response?._id ||
        response?.id;

      if (!createdInvoiceId) {
        throw new Error('Invoice created but ID was not returned from server');
      }

      await InvoiceSubmitToZatcaRequest(decodedToken, createdInvoiceId);
      showToast('Invoice created and submitted to ZATCA successfully!', 'success');
      navigate('/invoices');
    } catch (error) {
      showToast(error?.message || 'Failed to create and submit invoice to ZATCA', 'error');
    } finally {
      _isLoading(false);
    }
  };

  const handleUpdateAndSubmitToZatca = async () => {
    if (!handleValidateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (isLoading) {
      showToast('Please wait for the previous request to complete', 'error');
      return;
    }
    try {
      _isLoading(true);
      const payloadData = {
        referenceNumber: formData.data.referenceNumber,
        customerId: String(formData.data.customerId || ''),
        paymentType: formData.data.paymentType || 'CASH',
        paymentTerms: formData.data.paymentTerms,
        deliveryDate: formData.data.deliveryDate,
        currency: 'SAR',
        lineItems: lineItems.map((item) => ({
          description: item.description,
          productCode: item.productCode,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          discount_amount: Number(item.discount_amount) || 0,
          discount_percentage: Number(item.discount_percentage) || 0,
          taxExempt: !!item.taxExempt,
          taxExemptReason: item.taxExemptReason || '',
        })),
        vat: 15,
        note: formData.data.note,
      };

      await InvoiceUpdateRequest(decodedToken, id, JSON.stringify(payloadData));
      await InvoiceSubmitToZatcaRequest(decodedToken, id);
      showToast('Invoice updated and submitted to ZATCA successfully!', 'success');
      navigate('/invoices');
    } catch (error) {
      showToast(error?.message || 'Failed to update and submit invoice to ZATCA', 'error');
    } finally {
      _isLoading(false);
    }
  };

  const handleAddLineItem = () => {
    _lineItems((old) => [...old, { ...INITIAL_LINE_ITEM }]);
  };

  const handleChangeLineItem = (index, field, value) => {
    _lineItems((old) =>
      old.map((item, i) => {
        if (i !== index) return item;

        // Calculate numeric value for numeric fields
        const numValue = field === 'taxExempt'
          ? value
          : field === 'quantity' || field === 'price' || field === 'discount_amount' || field === 'discount_percentage'
            ? value === '' ? '' : Number(value) || 0
            : value;

        // Get current item values for calculations
        const quantity = field === 'quantity' ? numValue : (Number(item.quantity) || 0);
        const price = field === 'price' ? numValue : (Number(item.price) || 0);
        const lineTotal = quantity * price;

        // Handle discount_amount change - update discount_percentage
        if (field === 'discount_amount') {
          const discountAmount = numValue;
          const discountPercentage = lineTotal > 0
            ? ((discountAmount / lineTotal) * 100).toFixed(2)
            : 0;
          return {
            ...item,
            discount_amount: discountAmount,
            discount_percentage: parseFloat(discountPercentage) || 0,
          };
        }

        // Handle discount_percentage change - update discount_amount
        if (field === 'discount_percentage') {
          const discountPercentage = numValue;
          const discountAmount = lineTotal > 0
            ? ((lineTotal * discountPercentage) / 100).toFixed(2)
            : 0;
          return {
            ...item,
            discount_percentage: discountPercentage,
            discount_amount: parseFloat(discountAmount) || 0,
          };
        }

        // Handle quantity or price change - recalculate discount_amount if discount_percentage exists
        if (field === 'quantity' || field === 'price') {
          const updatedItem = {
            ...item,
            [field]: numValue,
          };
          const currentDiscountPercentage = Number(item.discount_percentage) || 0;
          if (currentDiscountPercentage > 0) {
            const newLineTotal = (field === 'quantity' ? numValue : quantity) * (field === 'price' ? numValue : price);
            const recalculatedDiscountAmount = newLineTotal > 0
              ? ((newLineTotal * currentDiscountPercentage) / 100).toFixed(2)
              : 0;
            updatedItem.discount_amount = parseFloat(recalculatedDiscountAmount) || 0;
          }
          return updatedItem;
        }

        // Default case - just update the field
        return {
          ...item,
          [field]: numValue,
        };
      })
    );
  };

  const handleRemoveLineItem = (index) => {
    _lineItems((old) => old.filter((_, i) => i !== index));
  };

  // *********** Render Functions ***********
  const PAGE_HEADER = () => (
    <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[#0d121b] dark:text-white text-3xl font-black leading-tight">
          {id ? 'Edit Invoice' : 'Create Invoice'}
        </h1>
        <p className="text-[#4c669a] dark:text-gray-400 text-base font-normal">
          {id ? 'Update and manage your compliant tax invoice.' : 'Create compliant tax invoices or bulk process via XML/PDF.'}
        </p>
      </div>
    </div>
  );

  const INVOICE_DETAILS_SECTION = () => (
    <section>
      <h3 className="text-[#0d121b] dark:text-white text-base font-bold mb-4 flex items-center gap-2">
        <span className="size-2 rounded-full bg-primary"></span> Invoice Details / تفاصيل الفاتورة
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Row 1 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Invoice Number</label>
          <input
            name="invoiceNumber"
            type="text"
            disabled={true}
            value={formData.data.invoiceNumber}
            onChange={() => { }}
            // onChange={handleChangeFormData}
            placeholder="Auto-generated field"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          />
          {formData.errors.invoiceNumber && (
            <span className="text-xs text-tomato">{formData.errors.invoiceNumber}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Invoice Type</label>
          <select
            name="invoiceType"
            value={formData.data.invoiceType}
            onChange={handleChangeFormData}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white pr-8 text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          >
            <option value="">Select invoice type...</option>
            <option value="standard">Standard Tax Invoice (B2B)</option>
            <option value="simplified">Simplified Tax Invoice (B2C)</option>
          </select>
          {formData.errors.invoiceType && (
            <span className="text-xs text-tomato">{formData.errors.invoiceType}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Reference Number</label>
          <input
            name="referenceNumber"
            type="text"
            value={formData.data.referenceNumber}
            onChange={handleChangeFormData}
            placeholder="REF-00000"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          />
          {formData.errors.referenceNumber && (
            <span className="text-xs text-tomato">{formData.errors.referenceNumber}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Payment Type</label>
          <select
            name="paymentType"
            value={formData.data.paymentType}
            onChange={handleChangeFormData}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white pr-8 text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          >
            <option value="">Select payment type...</option>
            <option value="CASH">CASH</option>
            <option value="CREDIT_CARD">CREDIT CARD</option>
            <option value="BANK_TRANSFER">BANK TRANSFER</option>
            <option value="CHECK">CHECK</option>
            <option value="BANK_CARD">BANK CARD</option>
          </select>
          {formData.errors.paymentType && (
            <span className="text-xs text-tomato">{formData.errors.paymentType}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Payment Terms</label>
          <input
            name="paymentTerms"
            type="text"
            value={formData.data.paymentTerms}
            onChange={handleChangeFormData}
            placeholder="e.g. Net 30"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          />
          {formData.errors.paymentTerms && (
            <span className="text-xs text-tomato">{formData.errors.paymentTerms}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Delivery Date</label>
          <input
            name="deliveryDate"
            type="date"
            value={formData.data.deliveryDate}
            onChange={handleChangeFormData}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          />
        </div>

        {/* Row 3 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Due Date</label>
          <input
            name="dueDate"
            type="date"
            value={formData.data.dueDate}
            onChange={handleChangeFormData}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          />
          {formData.errors.dueDate && (
            <span className="text-xs text-tomato">{formData.errors.dueDate}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Currency</label>
          <input
            type="text"
            value="SAR"
            disabled
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-gray-50 text-sm text-[#0d121b] dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Note</label>
          <input
            name="note"
            type="text"
            value={formData.data.note}
            onChange={handleChangeFormData}
            placeholder="Internal note"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          />
        </div>
      </div>
    </section>
  );

  const BUYER_INFO_SECTION = () => (
    <section>
      <h3 className="text-[#0d121b] dark:text-white text-base font-bold mb-4 flex items-center gap-2">
        <span className="size-2 rounded-full bg-primary"></span> Buyer Information / معلومات المشتري
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Registered Name (AsyncSelect) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Registered Name</label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadCustomerOptions}
            onChange={handleCustomerChange}
            value={
              formData.data.registrationName
                ? { label: formData.data.registrationName, value: formData.data.registrationName }
                : null
            }
            placeholder="Select or search customer..."
            classNames={{
              control: (state) =>
                `!px-2 !py-0.5 !rounded-lg !border !bg-white dark:!bg-[#161f30] !shadow-none hover:!border-primary focus:!border-primary !transition-colors ${state.isFocused ? '!border-primary !ring-1 !ring-primary' : '!border-[#e7ebf3] dark:!border-[#2a3447]'
                }`,
              menu: () => '!bg-white dark:!bg-[#161f30] !border !border-[#e7ebf3] dark:!border-[#2a3447] !rounded-lg !shadow-lg !mt-1 !z-50',
              option: (state) =>
                `!px-4 !py-2 !cursor-pointer !text-sm ${state.isSelected
                  ? '!bg-primary !text-white'
                  : state.isFocused
                    ? '!bg-gray-50 dark:!bg-gray-800 !text-[#0d121b] dark:!text-white'
                    : '!text-[#0d121b] dark:!text-white'
                }`,
              input: () => '!text-sm !text-[#0d121b] dark:!text-white',
              singleValue: () => '!text-sm !text-[#0d121b] dark:!text-white',
              placeholder: () => '!text-sm !text-[#4c669a]',
            }}
          />
          {formData.errors.customerId && (
            <span className="text-xs text-tomato">{formData.errors.customerId}</span>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Email</label>
          <input
            name="email"
            type="email"
            value={formData.data.email}
            onChange={handleChangeFormData}
            placeholder="customer@example.com"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
          {formData.errors.email && (
            <span className="text-xs text-tomato">{formData.errors.email}</span>
          )}
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Phone</label>
          <input
            name="phone"
            type="text"
            value={formData.data.phone}
            onChange={handleChangeFormData}
            placeholder="+966 11 234 5678"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* VAT */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Customer VAT</label>
          <input
            name="customerVAT"
            type="text"
            value={formData.data.customerVAT}
            onChange={handleChangeFormData}
            placeholder="300000000000003"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* Registration Name Arabic */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Registered Name (AR)</label>
          <input
            name="registrationNameAr"
            type="text"
            value={formData.data.registrationNameAr}
            onChange={handleChangeFormData}
            placeholder="شركة أكمي"
            dir="rtl"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* Street Name */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Street Name</label>
          <input
            name="streetName"
            type="text"
            value={formData.data.streetName}
            onChange={handleChangeFormData}
            placeholder="Prince Sultan Street"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* Street Name Arabic */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Street Name (AR)</label>
          <input
            name="streetNameAr"
            type="text"
            value={formData.data.streetNameAr}
            onChange={handleChangeFormData}
            placeholder="شارع الأمير سلطان"
            dir="rtl"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* Address */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Address</label>
          <input
            name="address"
            type="text"
            value={formData.data.address}
            onChange={handleChangeFormData}
            placeholder="Building 1234, Prince Sultan Street, Riyadh"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* Address Arabic */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Address (AR)</label>
          <input
            name="addressAr"
            type="text"
            value={formData.data.addressAr}
            onChange={handleChangeFormData}
            placeholder="مبنى 1234، شارع الأمير سلطان، الرياض"
            dir="rtl"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* Building Number */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Building Number</label>
          <input
            name="buildingNumber"
            type="text"
            value={formData.data.buildingNumber}
            onChange={handleChangeFormData}
            placeholder="1234"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* City Subdivision */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">District</label>
          <input
            name="citySubdivisionName"
            type="text"
            value={formData.data.citySubdivisionName}
            onChange={handleChangeFormData}
            placeholder="District 5"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* City Subdivision Arabic */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">District (AR)</label>
          <input
            name="citySubdivisionNameAr"
            type="text"
            value={formData.data.citySubdivisionNameAr}
            onChange={handleChangeFormData}
            placeholder="الحي الخامس"
            dir="rtl"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* City Name */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">City</label>
          <input
            name="cityName"
            type="text"
            value={formData.data.cityName}
            onChange={handleChangeFormData}
            placeholder="Riyadh"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* City Name Arabic */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">City (AR)</label>
          <input
            name="cityNameAr"
            type="text"
            value={formData.data.cityNameAr}
            onChange={handleChangeFormData}
            placeholder="الرياض"
            dir="rtl"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* Postal Zone */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Postal Zone</label>
          <input
            name="postalZone"
            type="text"
            value={formData.data.postalZone}
            onChange={handleChangeFormData}
            placeholder="12345"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>

        {/* Country Code */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Country Code</label>
          <input
            name="countryCode"
            type="text"
            value={formData.data.countryCode}
            onChange={handleChangeFormData}
            placeholder="SA"
            disabled={!!formData.data.customerId}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white disabled:bg-gray-50 dark:disabled:bg-[#0a0e1a] disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-gray-500"
          />
        </div>
      </div>
    </section>
  );

  const getItemNetTotal = (item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const discountAmt = Number(item.discount_amount) || 0;
    const discountPct = Number(item.discount_percentage) || 0;
    let total = qty * price;
    if (discountPct > 0) total -= total * (discountPct / 100);
    if (discountAmt > 0) total -= discountAmt;
    return Math.max(0, total);
  };

  const LINE_ITEMS_SECTION = () => {
    const calculateTotal = (item) => {
      return getItemNetTotal(item).toFixed(2);
    };

    return (
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[#0d121b] dark:text-white text-base font-bold flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary"></span> Line Items / الأصناف
          </h3>
          <button
            type="button"
            onClick={handleAddLineItem}
            className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
          >
            + Add Item
          </button>
        </div>
        <div className="border border-[#e7ebf3] dark:border-[#2a3447] rounded-lg overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f6f8] dark:bg-[#161f30] text-[#4c669a] dark:text-gray-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 w-28">Product Code</th>
                <th className="px-4 py-3 w-20">Qty</th>
                <th className="px-4 py-3 w-28">Price (SAR)</th>
                <th className="px-4 py-3 w-28">Disc. Amt</th>
                <th className="px-4 py-3 w-24">Disc. %</th>
                <th className="px-4 py-3 w-24">Tax Exempt</th>
                <th className="px-4 py-3 w-32">Exempt Reason</th>
                <th className="px-4 py-3 w-28 text-right">Total</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebf3] dark:divide-[#2a3447] dark:text-white">
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400 italic">
                    No line items added. Click "Add Item" to add one.
                  </td>
                </tr>
              ) : (
                lineItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <input
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 dark:text-white"
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleChangeLineItem(index, 'description', e.target.value)
                        }
                        placeholder="Description of product..."
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 dark:text-white"
                        type="text"
                        value={item.productCode}
                        onChange={(e) =>
                          handleChangeLineItem(index, 'productCode', e.target.value)
                        }
                        placeholder="Product Code"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 dark:text-white"
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleChangeLineItem(index, 'quantity', e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 dark:text-white"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          handleChangeLineItem(index, 'price', e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 dark:text-white"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount_amount}
                        onChange={(e) =>
                          handleChangeLineItem(index, 'discount_amount', e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 dark:text-white"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={item.discount_percentage}
                        onChange={(e) =>
                          handleChangeLineItem(index, 'discount_percentage', e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={item.taxExempt}
                        onChange={(e) =>
                          handleChangeLineItem(index, 'taxExempt', e.target.checked)
                        }
                        className="w-4 h-4 rounded border-[#e7ebf3] dark:border-[#2a3447] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 dark:text-white"
                        type="text"
                        value={item.taxExemptReason}
                        onChange={(e) =>
                          handleChangeLineItem(index, 'taxExemptReason', e.target.value)
                        }
                        placeholder="e.g. Export"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {calculateTotal(item)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(index)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {formData.errors.lineItems && (
          <span className="text-xs text-tomato mt-2 block">{formData.errors.lineItems}</span>
        )}
      </section>
    );
  };

  const FORM_CONTENT = () => (
    <form
      className="p-6 space-y-8 max-h-[calc(100vh-320px)] overflow-y-auto"
      onSubmit={handleSubmitForm}
    >
      {INVOICE_DETAILS_SECTION()}
      {BUYER_INFO_SECTION()}
      {LINE_ITEMS_SECTION()}
    </form>
  );


  const FOOTER_ACTION_BAR = () => {
    const calculateTotal = () => {
      const total = lineItems.reduce((acc, item) => acc + getItemNetTotal(item), 0);
      return total.toFixed(2);
    };
    const calculateVat = () => {
      const total = lineItems.reduce((acc, item) => acc + getItemNetTotal(item), 0);
      return (total * 0.15).toFixed(2);
    };
    const calculateGrandTotal = () => {
      const total = lineItems.reduce((acc, item) => acc + getItemNetTotal(item), 0);
      return (total * 1.15).toFixed(2);
    };
    return (
      <Fragment>
        <div className="bg-[#f5f6f8] dark:bg-[#0a0e1a] border-t border-[#e7ebf3] dark:border-[#2a3447] p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#4c669a] uppercase">Subtotal</span>
                <span className="text-lg font-bold dark:text-white">{calculateTotal()} SAR</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-primary uppercase">VAT (15%)</span>
                <span className="text-lg font-bold dark:text-white">{calculateVat()} SAR</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#0d121b] dark:text-gray-300 uppercase">Grand Total</span>
                <span className="text-2xl font-black text-primary">{calculateGrandTotal()} SAR</span>
              </div>
            </div>

            {/* Actions Select (react-select, text remains 'Actions') */}
            <div className="w-full md:w-80">
              <label className="sr-only">Invoice actions</label>
              <div className="relative">
                <Select
                  instanceId="invoice-actions"
                  placeholder="Actions"
                  isSearchable={false}
                  isClearable={false}
                  value={null}
                  onChange={(option) => {
                    if (!option) return;

                    if (option.value === 'cancel') {
                      navigate('/invoices');
                      return;
                    }

                    if (option.value === 'create-report-zatca') {
                      if (id) {
                        handleUpdateAndSubmitToZatca();
                      } else {
                        handleCreateAndSubmitToZatca();
                      }
                      return;
                    }

                    // Default action: simple create/update without ZATCA submission
                    handleSubmitForm();
                  }}
                  isDisabled={isLoading || invoiceData?.isError}
                  options={[
                    { value: 'create', label: id ? 'Update' : 'Create' },
                    { value: 'create-check-compliance', label: id ? 'Update and Check Compliance' : 'Create and Check Compliance' },
                    { value: 'create-report-zatca', label: id ? 'Update and Report to ZATCA' : 'Create and Report to ZATCA' },
                    { value: 'cancel', label: 'Cancel' },
                  ]}
                  classNamePrefix="react-select"
                  className="react-select-container"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: '2.5rem',
                      borderRadius: '0.5rem',
                      borderColor: '#2563eb',
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(37, 99, 235, 0.4)' : 'none',
                      '&:hover': { borderColor: '#2563eb' },
                      backgroundColor: 'transparent',
                    }),
                    placeholder: (base) => ({
                      ...base,
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: '#2563eb',
                    }),
                    singleValue: (base) => ({
                      ...base,
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: '#2563eb',
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 30,
                      minWidth: '20rem',
                    }),
                    option: (base, state) => ({
                      ...base,
                      color:
                        state.data.value === 'cancel'
                          ? '#f87171' // Tailwind red-400
                          : base.color,
                    }),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-[#4c669a] dark:text-gray-400 bg-white/50 dark:bg-black/20 p-2 rounded border border-dashed border-[#e7ebf3] dark:border-[#2a3447]">
          <span className="material-symbols-outlined text-[16px]">info</span>
          Validation required before submission. Fields must match Phase 2 technical specifications.
        </div>
      </Fragment>
    );
  };

  const MANUAL_ENTRY_FORM = () => (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447]">
      {FORM_CONTENT()}
      {FOOTER_ACTION_BAR()}
    </div>
  );

  const MAIN_GRID = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-12">
        {MANUAL_ENTRY_FORM()}
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

export default InvoiceForm;
