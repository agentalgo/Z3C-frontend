// Packages
import { Fragment, useState, useMemo, Suspense, use, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useParams } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import { useAtomValue } from 'jotai';

// APIs
import { InvoiceCreateRequest, InvoiceDetailRequest, InvoiceUpdateRequest, InvoiceCheckComplianceRequest, InvoiceSubmitToZatcaRequest, InvoicePdfDownloadRequest, CustomerListRequest } from '../../../requests';

// Utils
import { Footer, ErrorFallback } from '../../../components';
import { showToast, validateSubmissionData, decodeString, INVOICE_STATUSES, parseLoginInfo, getNormalizedModulePermissions } from '../../../utils';
import { auth, loginInfo } from '../../../atoms';

const INITIAL_FORM_DATA = {
  data: {
    status: '',
    invoiceNumber: '',
    invoiceType: 'B2B',
    customerId: null,
    referenceNumber: '',
    paymentType: '',
    paymentTerms: '',
    customerCategory: 'corporate',
    deliveryDate: '',
    // Customer fields (matched with registration fields)
    registrationName: '',
    registrationNameAr: '',
    email: '',
    phone: '',
    customerVAT: '',
    crn: '',
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
    vat: 15
  },
  validations: {
    referenceNumber: { isRequired: true, label: 'Reference Number' },
    customerId: { isRequired: true, label: 'Customer' },
    paymentTerms: { isRequired: false, label: 'Payment Terms' },
    // deliveryDate: { isRequired: true, label: 'Delivery Date' },
    vat: { isRequired: true, isNumber: true, label: 'VAT' }
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

const SELECT_MENU_STYLES = {
  menuPortal: (base) => ({ ...base, zIndex: 60 }),
};

const INVOICE_TYPE_OPTIONS = [
  { value: 'B2B', label: 'B2B' },
  { value: 'B2C', label: 'B2C' },
  { value: 'B2G', label: 'B2G' },
  { value: 'CREDIT_NOTE', label: 'CREDIT_NOTE', disabled: true },
  { value: 'DEBIT_NOTE', label: 'DEBIT_NOTE', disabled: true },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: '', label: 'Select payment type...' },
  { value: 'CASH', label: 'CASH' },
  { value: 'CREDIT_CARD', label: 'CREDIT CARD' },
  { value: 'BANK_TRANSFER', label: 'BANK TRANSFER' },
  { value: 'CHECK', label: 'CHECK' },
  { value: 'BANK_CARD', label: 'BANK CARD' },
];

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
          <div className="breeze-page flex-1">
            <div className="breeze-form-card px-6 py-10">
              <div className="flex items-center justify-center gap-2 text-[var(--z3c-subtle)]">
                <span className="material-symbols-outlined animate-spin">sync</span>
                Loading invoice details...
              </div>
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
    <div id="invoice-form" className="flex min-h-0 flex-1 flex-col">
      {CONTENT()}
    </div>
  );
}

function InvoiceFormContent({ id, invoicePromise, decodedToken, navigate }) {
  const invoiceData = invoicePromise ? use(invoicePromise) : null;
  const loginInfoValue = useAtomValue(loginInfo);
  const invoicePerms = useMemo(() => getNormalizedModulePermissions(parseLoginInfo(loginInfoValue), 'invoice'), [loginInfoValue]);
  const [formData, _formData] = useState({ ...INITIAL_FORM_DATA });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStatusConfig = INVOICE_STATUSES.find((status) => status.name === formData.data.status);
  const canEditInvoice = (!id || currentStatusConfig?.canEdit) && (!id || invoicePerms.update);
  const canSubmitToZatca = !id || currentStatusConfig?.canSubmitToZatca;
  const canCheckComplianceForExistingInvoice = !!currentStatusConfig?.canCheckCompliance;
  const canCheckComplianceForDraft = !!INVOICE_STATUSES.find((status) => status.name === 'DRAFT')?.canCheckCompliance;
  const canCheckComplianceAction = id ? canCheckComplianceForExistingInvoice : canCheckComplianceForDraft;

  const getItemNetTotal = (item) => {
    const qty = Number(item.quantity) || 0;
    const priceCents = Math.round((Number(item.price) || 0) * 100);
    const discountAmtCents = Math.round((Number(item.discount_amount) || 0) * 100);

    // Formula: (price - discount_amount) × qty
    // discount_amount is always synced from discount_percentage when percentage is used
    const discountedPriceCents = priceCents - discountAmtCents;
    return Math.max(0, discountedPriceCents * qty) / 100;
  };

  const [lineItems, _lineItems] = useState([{ ...INITIAL_LINE_ITEM }]);

  const totals = useMemo(() => {
    const totalCents = lineItems.reduce(
      (acc, item) => acc + Math.round(getItemNetTotal(item) * 100),
      0
    );
    const taxableCents = lineItems.reduce(
      (acc, item) => item.taxExempt ? acc : acc + Math.round(getItemNetTotal(item) * 100),
      0
    );
    const subtotal = (totalCents / 100).toFixed(2);
    const vatPercentage = Number(formData.data.vat);
    const vatCents = Math.round(taxableCents * (vatPercentage / 100));
    const vatAmount = (vatCents / 100).toFixed(2);
    const grandTotal = ((totalCents + vatCents) / 100).toFixed(2);

    return { subtotal, vatAmount, grandTotal };
  }, [lineItems, formData.data.vat]);

  useEffect(() => {
    if (invoiceData?.data) {
      const apiData = invoiceData.data;
      const customer = apiData.customerId || {};
      _formData(old => ({
        ...old,
        data: {
          ...old.data,
          invoiceNumber: apiData.invoiceNumber || '',
          invoiceType: apiData.invoiceType || '',
          referenceNumber: apiData.referenceNumber || '',
          paymentType: apiData.paymentType || '',
          paymentTerms: apiData.paymentTerms || '',
          deliveryDate: apiData.deliveryDate ? new Date(apiData.deliveryDate).toISOString().split('T')[0] : '',
          // Customer fields from nested customerId object
          customerId: customer._id ? String(customer._id) : null,
          registrationName: customer.registrationName || '',
          registrationNameAr: customer.registrationNameAr || '',
          email: customer.email || '',
          phone: customer.phone || '',
          customerVAT: customer.customerVAT || '',
          crn: customer.crn || '',
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
          vat: apiData.vat,
          status: apiData.status || '',
        },
      }));

      if (apiData.lineItems?.length) {
        _lineItems(apiData.lineItems.map(item => ({
          description: item.description || '',
          productCode: item.productCode || '',
          quantity: 1,
          // API returns price and discount_amount in cents, so we need to convert it to SAR
          price: item.price ? item.price / 100 : 0,
          discount_amount: item.discount_amount ? item.discount_amount / 100 : 0,
          discount_percentage: item.discount_percentage || 0,
          taxExempt: item.taxExempt || false,
          taxExemptReason: item.taxExemptReason || '',
        })));
      } else {
        _lineItems([{ ...INITIAL_LINE_ITEM }]);
      }
    } else if (invoiceData?.isError) {
      _formData({ ...INITIAL_FORM_DATA });
      _lineItems([{ ...INITIAL_LINE_ITEM }]);
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
          crn: customer.crn || '',
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
          crn: '',
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

  const handleValidateLineItems = () => {
    // Check if lineItems array is empty
    if (!lineItems || lineItems.length === 0) {
      return { allValid: false, errors: { empty: 'Line items should not be empty' } };
    }

    const validationData = {
      description: { isRequired: true },
      productCode: { isRequired: false },
      quantity: { isRequired: true, isNumber: true },
      price: { isRequired: true, isNumber: true },
    };

    let allValid = true;
    const lineItemErrors = {};

    // Validate each line item
    lineItems.forEach((item, index) => {
      const { allValid: itemValid, errors: itemErrors } = validateSubmissionData(
        item,
        validationData
      );

      const errors = { ...itemErrors };

      // discount_percentage must not exceed 100%
      const discountPct = Number(item.discount_percentage) || 0;
      if (discountPct > 100) {
        errors.discount_percentage = 'Discount percentage cannot exceed 100%';
      }

      // If taxExempt is true, taxExemptReason is required
      if (item.taxExempt && (!item.taxExemptReason || item.taxExemptReason.trim() === '')) {
        errors.taxExemptReason = 'Tax exempt reason is required when tax exempt is selected';
      }

      if (!itemValid || Object.keys(errors).length > 0) {
        allValid = false;
        lineItemErrors[index] = errors;
      }
    });

    return { allValid, errors: lineItemErrors };
  };

  const getLineItemsErrorMessage = (lineItemErrors) => {
    // Handle empty line items case
    if (lineItemErrors.empty) {
      return lineItemErrors.empty;
    }

    const missingFields = new Set();

    Object.values(lineItemErrors).forEach((errors) => {
      if (typeof errors === 'object' && errors !== null) {
        Object.keys(errors).forEach((field) => {
          missingFields.add(field);
        });
      }
    });

    const fieldNames = Array.from(missingFields).map(field => {
      // Convert camelCase to Title Case
      return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
    });

    return `Line items have missing ${fieldNames.join(', ')}`;
  };

  const handleValidateForm = () => {
    const { allValid, errors } = validateSubmissionData(
      formData.data,
      formData.validations
    );

    const validationErrors = { ...errors };
    let isValid = allValid;

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

  const handleValidateAll = () => {
    // Run both validations in parallel
    const formValidation = handleValidateForm();
    const lineItemsValidation = handleValidateLineItems();

    const formValid = formValidation;
    const lineItemsValid = lineItemsValidation.allValid;

    // Show toast messages for each error type
    if (!formValid) {
      showToast('Please fill in all required fields', 'error');
    }

    if (!lineItemsValid) {
      const errorMessage = getLineItemsErrorMessage(lineItemsValidation.errors);
      showToast(errorMessage, 'error');
    }

    return formValid && lineItemsValid;
  };

  const setSubmitPayload = (useCents = false) => {
    return {
      referenceNumber: formData.data.referenceNumber,
      customerId: String(formData.data.customerId || ''),
      paymentType: formData.data.paymentType || 'CASH',
      paymentTerms: formData.data.paymentTerms || undefined,
      deliveryDate: formData.data.deliveryDate,
      invoiceType: formData.data.invoiceType || 'B2B',
      vat: Number(formData.data.vat),
      note: formData.data.note,
      currency: 'SAR',
      grandTotal: totals.grandTotal,
      lineItems: lineItems.map((item) => {
        const price = Number(item.price) || 0;
        const discountAmount = Number(item.discount_amount) || 0;
        return {
          description: item.description,
          productCode: item.productCode || undefined,
          quantity: 1,
          price: useCents ? price * 100 || 0 : price,
          discount_amount: useCents ? discountAmount * 100 || 0 : discountAmount,
          discount_percentage: Number(item.discount_percentage) || 0,
          taxExempt: !!item.taxExempt,
          taxExemptReason: item.taxExemptReason || '',
        };
      }),
    };
  };

  const handleSubmitForm = async (e) => {
    if (e) e.preventDefault();

    if (isSubmitting) {
      showToast('Please wait for the previous request to complete', 'error');
      return;
    }

    // Validate both form and line items in parallel
    if (!handleValidateAll()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const payloadData = setSubmitPayload(true);

      if (id) {
        await InvoiceUpdateRequest(decodedToken, id, JSON.stringify(payloadData));
      } else {
        await InvoiceCreateRequest(decodedToken, JSON.stringify(payloadData));
      }

      showToast(id ? 'Invoice updated successfully!' : 'Invoice created successfully!', 'success');
      navigate('/invoices');
    } catch (err) {
      showToast(
        err?.message || (id ? 'Failed to update invoice' : 'Failed to create invoice'),
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleCreateInvoice = async () => {
    const payloadData = setSubmitPayload(true);
    const response = await InvoiceCreateRequest(decodedToken, JSON.stringify(payloadData));
    const createdInvoiceId =
      response?.data?._id ||
      response?._id ||
      response?.id;

    if (!createdInvoiceId) {
      throw new Error('Invoice created but ID was not returned from server');
    }

    return createdInvoiceId;
  };

  const handleUpdateInvoice = async () => {
    const payloadData = setSubmitPayload(true);
    await InvoiceUpdateRequest(decodedToken, id, JSON.stringify(payloadData));
    return id;
  };

  const handleSubmitToZatca = async (invoiceId) => {
    const targetId = invoiceId || id;
    if (!targetId) {
      throw new Error('Invoice ID is required to submit to ZATCA');
    }
    await InvoiceSubmitToZatcaRequest(decodedToken, targetId);
    return targetId;
  };

  const handleCheckCompliance = async () => {
    if (!id) return;

    if (isSubmitting) {
      showToast('Please wait for the previous request to complete', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await InvoiceCheckComplianceRequest(decodedToken, id);
      showToast('Invoice compliance check queued successfully!', 'success');
    } catch (error) {
      showToast(error?.message || 'Failed to queue invoice compliance check', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (!id) return;

    if (isSubmitting) {
      showToast('Please wait for the previous request to complete', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const pdfBlob = await InvoicePdfDownloadRequest(decodedToken, id);
      const fileURL = window.URL.createObjectURL(pdfBlob);
      const pdfWindow = window.open(fileURL, '_blank');

      if (!pdfWindow) {
        showToast('Please allow popups to view the invoice PDF', 'error');
      } else {
        showToast('Invoice PDF opened in a new tab', 'success');
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(fileURL);
      }, 10000);
    } catch (error) {
      showToast(error?.message || 'Failed to download invoice PDF', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAndSubmitToZatca = async () => {
    if (!id) return;

    if (isSubmitting) {
      showToast('Please wait for the previous request to complete', 'error');
      return;
    }

    if (!handleValidateAll()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await handleUpdateInvoice();
      await handleSubmitToZatca(id);
      showToast('Invoice updated and submitted to ZATCA successfully!', 'success');
      navigate('/invoices');
    } catch (error) {
      showToast(error?.message || 'Failed to update and submit invoice to ZATCA', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndSubmitToZatca = async () => {
    if (isSubmitting) {
      showToast('Please wait for the previous request to complete', 'error');
      return;
    }

    if (!handleValidateAll()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const createdInvoiceId = await handleCreateInvoice();
      await handleSubmitToZatca(createdInvoiceId);
      showToast('Invoice created and submitted to ZATCA successfully!', 'success');
      navigate('/invoices');
    } catch (error) {
      showToast(error?.message || 'Failed to create and submit invoice to ZATCA', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAndPrintInvoice = async () => {
    if (!id) return;

    if (isSubmitting) {
      showToast('Please wait for the previous request to complete', 'error');
      return;
    }

    if (!handleValidateAll()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await handleUpdateInvoice();
      const pdfBlob = await InvoicePdfDownloadRequest(decodedToken, id);
      const fileURL = window.URL.createObjectURL(pdfBlob);
      const pdfWindow = window.open(fileURL, '_blank');

      if (!pdfWindow) {
        showToast('Please allow popups to view the invoice PDF', 'error');
      } else {
        showToast('Invoice updated and PDF opened in a new tab', 'success');
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(fileURL);
      }, 10000);
    } catch (error) {
      showToast(error?.message || 'Failed to update invoice and download PDF', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndPrintInvoice = async () => {
    if (isSubmitting) {
      showToast('Please wait for the previous request to complete', 'error');
      return;
    }

    if (!handleValidateAll()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const createdInvoiceId = await handleCreateInvoice();
      const pdfBlob = await InvoicePdfDownloadRequest(decodedToken, createdInvoiceId);
      const fileURL = window.URL.createObjectURL(pdfBlob);
      const pdfWindow = window.open(fileURL, '_blank');

      if (!pdfWindow) {
        showToast('Please allow popups to view the invoice PDF', 'error');
      } else {
        showToast('Invoice created and PDF opened in a new tab', 'success');
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(fileURL);
      }, 10000);
    } catch (error) {
      showToast(error?.message || 'Failed to create invoice and download PDF', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAndCheckCompliance = async () => {
    if (!id) return;

    if (isSubmitting) {
      showToast('Please wait for the previous request to complete', 'error');
      return;
    }

    if (!handleValidateAll()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await handleUpdateInvoice();
      await InvoiceCheckComplianceRequest(decodedToken, id);
      showToast('Invoice updated and compliance check queued successfully!', 'success');
    } catch (error) {
      showToast(
        error?.message || 'Failed to update invoice and queue compliance check',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndCheckCompliance = async () => {
    if (isSubmitting) {
      showToast('Please wait for the previous request to complete', 'error');
      return;
    }

    if (!handleValidateAll()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const createdInvoiceId = await handleCreateInvoice();
      await InvoiceCheckComplianceRequest(decodedToken, createdInvoiceId);
      showToast('Invoice created and compliance check queued successfully!', 'success');
    } catch (error) {
      showToast(
        error?.message || 'Failed to create invoice and queue compliance check',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleCreateAndSubmitToZatca = async () => {
  //   if (isLoading) {
  //     showToast('Please wait for the previous request to complete', 'error');
  //     return;
  //   }

  //   // Validate both form and line items in parallel
  //   if (!handleValidateAll()) {
  //     return;
  //   }

  //   try {
  //     _isLoading(true);
  //     const payloadData = setSubmitPayload(true);
  //     const response = await InvoiceCreateRequest(decodedToken, JSON.stringify(payloadData));
  //     const createdInvoiceId =
  //       response?.data?._id ||
  //       response?._id ||
  //       response?.id;

  //     if (!createdInvoiceId) {
  //       throw new Error('Invoice created but ID was not returned from server');
  //     }

  //     await InvoiceSubmitToZatcaRequest(decodedToken, createdInvoiceId);
  //     showToast('Invoice created and submitted to ZATCA successfully!', 'success');
  //     navigate('/invoices');
  //   } catch (error) {
  //     showToast(error?.message || 'Failed to create and submit invoice to ZATCA', 'error');
  //   } finally {
  //     _isLoading(false);
  //   }
  // };

  // const handleUpdateAndSubmitToZatca = async () => {
  //   if (isLoading) {
  //     showToast('Please wait for the previous request to complete', 'error');
  //     return;
  //   }

  //   // Validate both form and line items in parallel
  //   if (!handleValidateAll()) {
  //     return;
  //   }

  //   try {
  //     _isLoading(true);
  //     const payloadData = setSubmitPayload(true);
  //     await InvoiceUpdateRequest(decodedToken, id, JSON.stringify(payloadData));
  //     await InvoiceSubmitToZatcaRequest(decodedToken, id);
  //     showToast('Invoice updated and submitted to ZATCA successfully!', 'success');
  //     navigate('/invoices');
  //   } catch (error) {
  //     showToast(error?.message || 'Failed to update and submit invoice to ZATCA', 'error');
  //   } finally {
  //     _isLoading(false);
  //   }
  // };

  const handleAddLineItem = () => {
    _lineItems((old) => [...old, { ...INITIAL_LINE_ITEM }]);
  };


  // const handleUpdateAndPrintPdf = async () => {
  //   if (!id) return;

  //   if (isLoading) {
  //     showToast('Please wait for the previous request to complete', 'error');
  //     return;
  //   }

  //   if (!handleValidateAll()) {
  //     return;
  //   }

  //   try {
  //     _isLoading(true);
  //     const payloadData = setSubmitPayload(true);
  //     await InvoiceUpdateRequest(decodedToken, id, JSON.stringify(payloadData));
  //     const pdfBlob = await InvoicePdfDownloadRequest(decodedToken, id);
  //     const fileURL = window.URL.createObjectURL(pdfBlob);
  //     const pdfWindow = window.open(fileURL, '_blank');

  //     if (!pdfWindow) {
  //       showToast('Please allow popups to view the invoice PDF', 'error');
  //     } else {
  //       showToast('Invoice updated and PDF opened in a new tab', 'success');
  //     }

  //     setTimeout(() => {
  //       window.URL.revokeObjectURL(fileURL);
  //     }, 10000);
  //   } catch (error) {
  //     showToast(error?.message || 'Failed to update invoice and download PDF', 'error');
  //   } finally {
  //     _isLoading(false);
  //   }
  // };

  // const handleCreateAndPrintPdf = async () => {
  //   if (isLoading) {
  //     showToast('Please wait for the previous request to complete', 'error');
  //     return;
  //   }

  //   if (!handleValidateAll()) {
  //     return;
  //   }

  //   try {
  //     _isLoading(true);
  //     const payloadData = setSubmitPayload(true);
  //     const response = await InvoiceCreateRequest(decodedToken, JSON.stringify(payloadData));
  //     const createdInvoiceId =
  //       response?.data?._id ||
  //       response?._id ||
  //       response?.id;

  //     if (!createdInvoiceId) {
  //       throw new Error('Invoice created but ID was not returned from server');
  //     }

  //     const pdfBlob = await InvoicePdfDownloadRequest(decodedToken, createdInvoiceId);
  //     const fileURL = window.URL.createObjectURL(pdfBlob);
  //     const pdfWindow = window.open(fileURL, '_blank');

  //     if (!pdfWindow) {
  //       showToast('Please allow popups to view the invoice PDF', 'error');
  //     } else {
  //       showToast('Invoice created and PDF opened in a new tab', 'success');
  //     }

  //     setTimeout(() => {
  //       window.URL.revokeObjectURL(fileURL);
  //     }, 10000);
  //   } catch (error) {
  //     showToast(error?.message || 'Failed to create invoice and download PDF', 'error');
  //   } finally {
  //     _isLoading(false);
  //   }
  // };

  const handleFormatLineItemNumericValues = (field, value) => {
    if (value === '') return '';

    if (field === 'quantity') {
      // Allow only digits (integer)
      return value.replace(/[^\d]/g, '');
    }

    if (['price', 'discount_amount', 'discount_percentage'].includes(field)) {
      // Allow only digits and at most one decimal point
      let sanitized = value.replace(/[^\d.]/g, '');
      const parts = sanitized.split('.');

      if (parts.length > 2) {
        // More than one dot - keep only the first dot and digits
        sanitized = parts[0] + '.' + parts.slice(1).join('');
      }

      // Limit to 2 decimal places if there is a dot
      if (sanitized.includes('.')) {
        const [intPart, decimalPart] = sanitized.split('.');
        sanitized = `${intPart}.${decimalPart.slice(0, 2)}`;
      }

      // Cap discount_percentage at 100%
      if (field === 'discount_percentage') {
        const num = parseFloat(sanitized);
        if (!Number.isNaN(num) && num > 100) {
          sanitized = '100';
        }
      }

      return sanitized;
    }

    return value;
  };

  const handleChangeLineItem = (index, field, value) => {
    _lineItems((old) =>
      old.map((item, i) => {
        if (i !== index) return item;

        // Format/Sanitize numeric values or use raw value for other fields
        const formattedValue = field === 'taxExempt'
          ? value
          : (field === 'quantity' || field === 'price' || field === 'discount_amount' || field === 'discount_percentage')
            ? handleFormatLineItemNumericValues(field, value)
            : value;

        // Get current item values for calculations (as numbers)
        const quantity = field === 'quantity'
          ? (formattedValue === '' ? 0 : Number(formattedValue) || 0)
          : (Number(item.quantity) || 0);
        const price = field === 'price'
          ? (formattedValue === '' ? 0 : Number(formattedValue) || 0)
          : (Number(item.price) || 0);

        // Work in integer cents for accurate 2-decimal math
        const priceCents = Math.round(price * 100);

        // Handle discount_amount change - percentage is based on unit price
        if (field === 'discount_amount') {
          const discountAmount = formattedValue;
          const discountAmountCents = Math.round((Number(discountAmount) || 0) * 100);
          const discountPercentage = priceCents > 0
            ? (discountAmountCents / priceCents) * 100
            : 0;
          return {
            ...item,
            discount_amount: discountAmount,
            discount_percentage: parseFloat(discountPercentage.toFixed(2)).toString() || '0',
          };
        }

        // Handle discount_percentage change - amount is based on unit price
        if (field === 'discount_percentage') {
          const discountPercentage = formattedValue;
          const discountPctNum = Math.min(Number(discountPercentage) || 0, 100);
          const discountAmountCents = priceCents > 0
            ? Math.round(priceCents * (discountPctNum / 100))
            : 0;
          const discountAmount = discountAmountCents / 100;
          return {
            ...item,
            discount_percentage: String(discountPctNum) === String(Number(discountPercentage) || 0) ? discountPercentage : String(discountPctNum),
            discount_amount: parseFloat(discountAmount.toFixed(2)).toString() || '0',
          };
        }

        // Handle quantity or price change - recalculate discount_amount from percentage based on new unit price
        if (field === 'quantity' || field === 'price') {
          const updatedItem = {
            ...item,
            [field]: formattedValue,
          };
          const currentDiscountPercentage = Number(item.discount_percentage) || 0;
          if (currentDiscountPercentage > 0) {
            const newPrice = field === 'price'
              ? (formattedValue === '' ? 0 : Number(formattedValue) || 0)
              : price;
            const newPriceCents = Math.round(newPrice * 100);
            const recalculatedDiscountAmountCents = newPriceCents > 0
              ? Math.round(newPriceCents * (currentDiscountPercentage / 100))
              : 0;
            updatedItem.discount_amount = parseFloat((recalculatedDiscountAmountCents / 100).toFixed(2)).toString() || '0';
          }
          return updatedItem;
        }

        // Default case - just update the field
        return {
          ...item,
          [field]: formattedValue,
        };
      })
    );
  };

  const handleRemoveLineItem = (index) => {
    _lineItems((old) => (old.length <= 1 ? old : old.filter((_, i) => i !== index)));
  };

  // *********** Render Functions ***********
  const inputClassName = (name, extra = '') =>
    `breeze-form-input${formData.errors[name] ? ' breeze-form-input--invalid' : ''}${extra ? ` ${extra}` : ''}`;

  const FIELD = ({ label, name, required, hint, children }) => (
    <div className="breeze-form-field">
      <label className="breeze-field__label" htmlFor={`invoice-${name}`}>
        {label}
        {required ? <span className="breeze-form-required" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {hint && !formData.errors[name] ? <p className="breeze-form-hint">{hint}</p> : null}
      {formData.errors[name] ? (
        <span className="breeze-field__error" id={`invoice-${name}-error`}>
          {formData.errors[name]}
        </span>
      ) : null}
    </div>
  );

  const TEXT_FIELD = ({
    label,
    name,
    required,
    type = 'text',
    placeholder,
    dir,
    disabled,
    min,
    max,
    step,
    hint,
  }) =>
    FIELD({
      label,
      name,
      required,
      hint,
      children: (
        <input
          id={`invoice-${name}`}
          type={type}
          name={name}
          value={formData.data[name] ?? ''}
          onChange={disabled ? undefined : handleChangeFormData}
          placeholder={placeholder}
          dir={dir}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          aria-invalid={Boolean(formData.errors[name])}
          aria-describedby={formData.errors[name] ? `invoice-${name}-error` : undefined}
          className={inputClassName(name)}
        />
      ),
    });

  const SELECT_FIELD = ({ label, name, required, children }) => (
    FIELD({ label, name, required, children })
  );

  const SECTION_HEADER = ({ icon, title, lede, action }) => (
    <div className="breeze-form-section__header flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <span className="breeze-form-section__badge" aria-hidden="true">
          <span className="material-symbols-outlined">{icon}</span>
        </span>
        <div className="min-w-0">
          <h3 className="breeze-form-section__title">{title}</h3>
          {lede ? <p className="breeze-form-section__lede">{lede}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );

  const PAGE_HEADER = () => (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="breeze-link breeze-page__back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Invoices
        </button>
        <h2 className="breeze-page__title">
          {id ? 'Edit Invoice' : 'Create Invoice'}
        </h2>
        <p className="breeze-page__lede">
          {id
            ? 'Update and manage your compliant tax invoice'
            : 'Create a Phase 2 compliant tax invoice'}
        </p>
      </div>
    </div>
  );

  const INVOICE_DETAILS_SECTION = () => (
    <section className="breeze-form-section">
      {SECTION_HEADER({
        icon: 'receipt_long',
        title: 'Invoice details',
        lede: 'Reference, payment, delivery date, and VAT for this tax invoice.',
      })}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
        {TEXT_FIELD({
          label: 'Invoice Number',
          name: 'invoiceNumber',
          placeholder: 'Auto-generated field',
          disabled: true,
        })}
        {SELECT_FIELD({
          label: 'Invoice Type',
          name: 'invoiceType',
          children: (
            <select
              id="invoice-invoiceType"
              name="invoiceType"
              value={formData.data.invoiceType || 'B2B'}
              onChange={handleChangeFormData}
              className="breeze-select"
            >
              {INVOICE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          ),
        })}
        {TEXT_FIELD({
          label: 'Reference Number',
          name: 'referenceNumber',
          required: true,
          placeholder: 'REF-00000',
        })}
        {SELECT_FIELD({
          label: 'Payment Type',
          name: 'paymentType',
          children: (
            <select
              id="invoice-paymentType"
              name="paymentType"
              value={formData.data.paymentType}
              onChange={handleChangeFormData}
              className={`breeze-select${formData.errors.paymentType ? ' breeze-form-input--invalid' : ''}`}
            >
              {PAYMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ),
        })}
        {TEXT_FIELD({
          label: 'Payment Terms',
          name: 'paymentTerms',
          placeholder: 'e.g. Net 30',
        })}
        {TEXT_FIELD({
          label: 'Delivery Date',
          name: 'deliveryDate',
          type: 'date',
        })}
        {FIELD({
          label: 'Currency',
          name: 'currency',
          children: (
            <input
              id="invoice-currency"
              type="text"
              value="SAR"
              disabled
              className="breeze-form-input"
            />
          ),
        })}
        {TEXT_FIELD({
          label: 'Note',
          name: 'note',
          placeholder: 'Internal note',
        })}
        {TEXT_FIELD({
          label: 'VAT (%)',
          name: 'vat',
          required: true,
          type: 'number',
          min: '0',
          max: '100',
          step: '0.01',
          placeholder: '15',
        })}
      </div>
    </section>
  );

  const BUYER_INFO_SECTION = () => {
    const isCustomerLocked = Boolean(formData.data.customerId);

    return (
      <section className="breeze-form-section">
        {SECTION_HEADER({
          icon: 'person',
          title: 'Buyer information',
          lede: 'Select a registered customer. Address and tax identifiers fill in automatically.',
        })}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {FIELD({
            label: 'Registered Name',
            name: 'customerId',
            required: true,
            children: (
              <AsyncSelect
                inputId="invoice-customerId"
                cacheOptions
                defaultOptions
                isClearable
                loadOptions={loadCustomerOptions}
                onChange={handleCustomerChange}
                value={
                  formData.data.registrationName
                    ? { label: formData.data.registrationName, value: formData.data.customerId || formData.data.registrationName }
                    : null
                }
                placeholder="Select or search customer..."
                classNamePrefix="breeze-rs"
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                styles={SELECT_MENU_STYLES}
              />
            ),
          })}
          {TEXT_FIELD({
            label: 'Email',
            name: 'email',
            type: 'email',
            placeholder: 'customer@example.com',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'Phone',
            name: 'phone',
            placeholder: '+966 11 234 5678',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'Customer VAT',
            name: 'customerVAT',
            placeholder: '300000000000003',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'CR# (Commercial Registration)',
            name: 'crn',
            placeholder: '1010884359',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'Registered Name (Arabic)',
            name: 'registrationNameAr',
            placeholder: 'شركة أكمي',
            dir: 'rtl',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'Street Name',
            name: 'streetName',
            placeholder: 'Prince Sultan Street',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'Street Name (Arabic)',
            name: 'streetNameAr',
            placeholder: 'شارع الأمير سلطان',
            dir: 'rtl',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'Address',
            name: 'address',
            placeholder: 'Building 1234, Prince Sultan Street, Riyadh',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'Address (Arabic)',
            name: 'addressAr',
            placeholder: 'مبنى 1234، شارع الأمير سلطان، الرياض',
            dir: 'rtl',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'Building Number',
            name: 'buildingNumber',
            placeholder: '1234',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'District',
            name: 'citySubdivisionName',
            placeholder: 'District 5',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'District (Arabic)',
            name: 'citySubdivisionNameAr',
            placeholder: 'الحي الخامس',
            dir: 'rtl',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'City',
            name: 'cityName',
            placeholder: 'Riyadh',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'City (Arabic)',
            name: 'cityNameAr',
            placeholder: 'الرياض',
            dir: 'rtl',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'Postal Zone',
            name: 'postalZone',
            placeholder: '12345',
            disabled: isCustomerLocked,
          })}
          {TEXT_FIELD({
            label: 'Country Code',
            name: 'countryCode',
            placeholder: 'SA',
            disabled: isCustomerLocked,
          })}
        </div>
      </section>
    );
  };


  const LINE_ITEMS_SECTION = () => {
    const calculateTotal = (item) => getItemNetTotal(item).toFixed(2);

    return (
      <section className="breeze-form-section">
        {SECTION_HEADER({
          icon: 'inventory_2',
          title: 'Line items',
          lede: 'Add products or services. Quantity is fixed at 1 per line.',
        })}

        <div className="flex flex-col gap-3">
          <div className="breeze-line-items lg:overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Product Code</th>
                  <th>Qty</th>
                  <th>Price (SAR)</th>
                  <th>Disc. Amt</th>
                  <th>Disc. %</th>
                  <th>Tax Exempt</th>
                  <th>Exempt Reason</th>
                  <th className="text-end">Total</th>
                  <th>
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index}>
                    <td data-label="Description" data-span="2">
                      <input
                        className="breeze-line-items__input"
                        type="text"
                        value={item.description}
                        onChange={(e) => handleChangeLineItem(index, 'description', e.target.value)}
                        placeholder="Description of product..."
                      />
                    </td>
                    <td data-label="Product Code">
                      <input
                        className="breeze-line-items__input"
                        type="text"
                        value={item.productCode}
                        onChange={(e) => handleChangeLineItem(index, 'productCode', e.target.value)}
                        placeholder="SKU"
                      />
                    </td>
                    <td data-label="Qty">
                      <input
                        className="breeze-line-items__input"
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        disabled
                      />
                    </td>
                    <td data-label="Price (SAR)">
                      <input
                        className="breeze-line-items__input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleChangeLineItem(index, 'price', e.target.value)}
                      />
                    </td>
                    <td data-label="Disc. Amt">
                      <input
                        className="breeze-line-items__input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount_amount}
                        onChange={(e) => handleChangeLineItem(index, 'discount_amount', e.target.value)}
                      />
                    </td>
                    <td data-label="Disc. %">
                      <input
                        className="breeze-line-items__input"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={item.discount_percentage}
                        onChange={(e) => handleChangeLineItem(index, 'discount_percentage', e.target.value)}
                      />
                    </td>
                    <td data-label="Tax Exempt" className='text-center'>
                      <label className="breeze-check">
                        <input
                          type="checkbox"
                          className="breeze-check__box"
                          checked={item.taxExempt}
                          onChange={(e) => handleChangeLineItem(index, 'taxExempt', e.target.checked)}
                          aria-label="Tax exempt"
                        />
                      </label>
                    </td>
                    <td data-label="Exempt Reason" data-span="2">
                      <input
                        className="breeze-line-items__input"
                        type="text"
                        value={item.taxExemptReason}
                        onChange={(e) => handleChangeLineItem(index, 'taxExemptReason', e.target.value)}
                        placeholder="e.g. Export"
                      />
                    </td>
                    <td data-label="Total" className="breeze-line-items__total lg:text-end">
                      {calculateTotal(item)}
                    </td>
                    <td data-label="Remove">
                      {lineItems.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(index)}
                          className="breeze-line-items__remove"
                          aria-label={`Remove line item ${index + 1}`}
                        >
                          <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={handleAddLineItem}
            className="breeze-btn breeze-btn--outline breeze-btn--inline self-end"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            Add item
          </button>
        </div>
        {formData.errors.lineItems ? (
          <span className="breeze-field__error">{formData.errors.lineItems}</span>
        ) : null}
      </section>
    );
  };

  const FOOTER_ACTION_BAR = () => {
    const actionsDisabled = isSubmitting || invoiceData?.isError;

    const handleSendToZatcaAction = () => {
      if (id) {
        handleUpdateAndSubmitToZatca();
      } else {
        handleCreateAndSubmitToZatca();
      }
    };

    const handleCheckComplianceActionClick = () => {
      if (!id) {
        handleCreateAndCheckCompliance();
        return;
      }
      if (canEditInvoice) {
        handleUpdateAndCheckCompliance();
        return;
      }
      handleCheckCompliance();
    };

    const handlePrintInvoiceAction = () => {
      if (id) {
        if (canEditInvoice) {
          handleUpdateAndPrintInvoice();
        } else {
          handlePrintInvoice();
        }
      } else {
        handleCreateAndPrintInvoice();
      }
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="breeze-invoice-footer">
          <div className="breeze-invoice-totals">
            <div className="breeze-invoice-totals__item">
              <p className="breeze-invoice-totals__label">Subtotal</p>
              <p className="breeze-invoice-totals__value">{totals.subtotal} SAR</p>
            </div>
            <div className="breeze-invoice-totals__item">
              <p className="breeze-invoice-totals__label breeze-invoice-totals__label--vat">
                VAT ({formData.data.vat}%)
              </p>
              <p className="breeze-invoice-totals__value">{totals.vatAmount} SAR</p>
            </div>
            <div className="breeze-invoice-totals__item">
              <p className="breeze-invoice-totals__label">Grand Total</p>
              <p className="breeze-invoice-totals__value breeze-invoice-totals__value--grand">
                {totals.grandTotal} SAR
              </p>
            </div>
          </div>
          <div className="breeze-invoice-actions">
            {canEditInvoice ? (
              <button
                type="submit"
                disabled={actionsDisabled}
                className="breeze-btn breeze-btn--primary"
              >
                <span className="material-symbols-outlined" aria-hidden="true">save</span>
                Save
              </button>
            ) : null}
            {canCheckComplianceAction ? (
              <button
                type="button"
                onClick={handleCheckComplianceActionClick}
                disabled={actionsDisabled}
                className="breeze-btn breeze-btn--outline"
              >
                <span className="material-symbols-outlined" aria-hidden="true">verified</span>
                Check Compliance
              </button>
            ) : null}
            {canEditInvoice && canSubmitToZatca ? (
              <button
                type="button"
                onClick={handleSendToZatcaAction}
                disabled={actionsDisabled}
                className="breeze-btn breeze-btn--outline"
              >
                <span className="material-symbols-outlined" aria-hidden="true">send</span>
                Send to ZATCA
              </button>
            ) : null}
            <button
              type="button"
              onClick={handlePrintInvoiceAction}
              disabled={actionsDisabled}
              className="breeze-btn breeze-btn--outline"
            >
              <span className="material-symbols-outlined" aria-hidden="true">print</span>
              Print Invoice
            </button>
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              disabled={isSubmitting}
              className="breeze-btn breeze-btn--danger-soft"
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
              Cancel
            </button>
          </div>
        </div>
        <p className="breeze-invoice-hint">
          <span className="material-symbols-outlined" aria-hidden="true">info</span>
          Validation is required before submission. Fields must match ZATCA Phase 2 technical specifications.
        </p>
      </div>
    );
  };

  const INVOICE_FORM = () => (
    <div className="breeze-form-card">
      <form
        className="breeze-form"
        onSubmit={(e) => {
          if (!canEditInvoice) {
            e.preventDefault();
            return;
          }
          handleSubmitForm(e);
        }}
        noValidate
      >
        {invoiceData?.isError && (
          <div className="breeze-alert" role="alert">
            <span className="material-symbols-outlined">error</span>
            <span>Unable to load this invoice. You can go back to the list and try again.</span>
          </div>
        )}
        {INVOICE_DETAILS_SECTION()}
        {BUYER_INFO_SECTION()}
        {LINE_ITEMS_SECTION()}
        {FOOTER_ACTION_BAR()}
      </form>
    </div>
  );

  const CONTENT = () => (
    <Fragment>
      <div className="breeze-page flex-1">
        {PAGE_HEADER()}
        {INVOICE_FORM()}
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

export default InvoiceForm;
