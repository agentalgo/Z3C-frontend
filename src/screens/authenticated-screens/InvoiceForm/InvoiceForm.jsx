// Packages
import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

// Utils
import { Footer } from '../../../components';
import { showToast, validateSubmissionData } from '../../../utils';

function InvoiceForm() {
  const navigate = useNavigate();

  const INITIAL_FORM_DATA = {
    data: {
      invoiceNumber: '',
      invoiceType: '',
      referenceNumber: '',
      paymentType: '',
      paymentTerms: '',
      companyProfile: '',
      dueDate: '',
      createdDate: '',
      supplyDate: '',
      registeredName: '',
      customerEmail: '',
      customerPhone: '',
      customerVat: '',
      customerAddress: '',
      customerCode: '',
    },
    validations: {
      invoiceNumber: { isRequired: true, label: 'Invoice Number' },
      invoiceType: { isRequired: true, label: 'Invoice Type' },
      paymentType: { isRequired: true, label: 'Payment Type' },
      paymentTerms: { isRequired: true, label: 'Payment Terms' },
      companyProfile: { isRequired: true, label: 'Company Profile' },
      dueDate: { isRequired: true, label: 'Due Date' },
      registeredName: { isRequired: true, label: 'Registered Name' },
      customerEmail: {
        isRequired: true,
        label: 'Customer Email',
        regex: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      },
    },
    errors: {},
  };

  const [formData, _formData] = useState({ ...INITIAL_FORM_DATA });

  const INITIAL_LINE_ITEM = {
    description: '',
    quantity: 1,
    price: '',
    taxExempt: false,
  };

  const [lineItems, _lineItems] = useState([]);

  /********  handlers  ********/
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
    e.preventDefault();
    if (handleValidateForm()) {
      // TODO: replace with actual submit logic
      console.log('Invoice form is valid', {
        ...formData.data,
        lineItems,
      });
      showToast('Invoice saved successfully', 'success');
    } else {
      showToast('Please fill in all required fields', 'error');
    }
  };

  const handleAddLineItem = () => {
    _lineItems((old) => [...old, { ...INITIAL_LINE_ITEM }]);
  };

  const handleChangeLineItem = (index, field, value) => {
    _lineItems((old) =>
      old.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]:
                field === 'taxExempt'
                  ? value
                  : field === 'quantity' || field === 'price'
                  ? value === '' ? '' : Number(value) || 0
                  : value,
            }
          : item
      )
    );
  };

  const handleRemoveLineItem = (index) => {
    _lineItems((old) => old.filter((_, i) => i !== index));
  };

  const PAGE_HEADER = () => (
    <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[#0d121b] dark:text-white text-3xl font-black leading-tight">Invoice</h1>
        <p className="text-[#4c669a] dark:text-gray-400 text-base font-normal">
          Create compliant tax invoices or bulk process via XML/PDF.
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
            value={formData.data.invoiceNumber}
            onChange={handleChangeFormData}
            placeholder="INV-00000"
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
        </div>

        {/* Row 2 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Payment Type</label>
          <select
            name="paymentType"
            value={formData.data.paymentType}
            onChange={handleChangeFormData}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white pr-8 text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          >
            <option value="">Select payment type...</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank-transfer">Bank Transfer</option>
          </select>
          {formData.errors.paymentType && (
            <span className="text-xs text-tomato">{formData.errors.paymentType}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Payment Terms</label>
          <select
            name="paymentTerms"
            value={formData.data.paymentTerms}
            onChange={handleChangeFormData}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white pr-8 text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          >
            <option value="">Select payment terms...</option>
            <option value="immediate">Immediate</option>
            <option value="15-days">15 Days</option>
            <option value="30-days">30 Days</option>
            <option value="60-days">60 Days</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Company Profile</label>
          <select
            name="companyProfile"
            value={formData.data.companyProfile}
            onChange={handleChangeFormData}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white pr-8 text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          >
            <option value="">Select company profile...</option>
            <option value="Fl3xx">Fl3xx</option>
            <option value="FB01">FB01</option>
            <option value="MR02">MR02</option>
            <option value="SM03">SM03</option>
          </select>
          {formData.errors.companyProfile && (
            <span className="text-xs text-tomato">{formData.errors.companyProfile}</span>
          )}
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
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Created Date</label>
          <input
            name="createdDate"
            type="date"
            value={formData.data.createdDate}
            onChange={handleChangeFormData}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Supply Date</label>
          <input
            name="supplyDate"
            type="date"
            value={formData.data.supplyDate}
            onChange={handleChangeFormData}
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
        {/* Registered Name (Dropdown) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Registered Name</label>
          <select
            name="registeredName"
            value={formData.data.registeredName}
            onChange={handleChangeFormData}
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white pr-8 text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          >
            <option value="">Select registered name...</option>
            <option value="ahmed-trading">Ahmed Al-Saud Trading Co.</option>
            <option value="spa-group">Saudia Private Aviation</option>
          </select>
          {formData.errors.registeredName && (
            <span className="text-xs text-tomato">{formData.errors.registeredName}</span>
          )}
        </div>

        {/* Customer Email */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Customer Email</label>
          <input
            name="customerEmail"
            type="email"
            value={formData.data.customerEmail}
            onChange={handleChangeFormData}
            placeholder="customer@example.com"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          />
          {formData.errors.customerEmail && (
            <span className="text-xs text-tomato">{formData.errors.customerEmail}</span>
          )}
        </div>

        {/* Customer Phone */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Customer Phone</label>
          <input
            name="customerPhone"
            type="text"
            value={formData.data.customerPhone}
            onChange={handleChangeFormData}
            placeholder="+966 11 234 5678"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          />
        </div>

        {/* VAT */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">VAT</label>
          <input
            name="customerVat"
            type="text"
            value={formData.data.customerVat}
            onChange={handleChangeFormData}
            placeholder="300012345600003"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          />
        </div>

        {/* Customer Address */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Customer Address</label>
          <input
            name="customerAddress"
            type="text"
            value={formData.data.customerAddress}
            onChange={handleChangeFormData}
            placeholder="King Fahd Road, Al Olaya District, Riyadh"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          />
        </div>

        {/* Customer Code */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">Customer Code</label>
          <input
            name="customerCode"
            type="text"
            value={formData.data.customerCode}
            onChange={handleChangeFormData}
            placeholder="CUST-0001"
            className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
          />
        </div>
      </div>
    </section>
  );

  const LINE_ITEMS_SECTION = () => {
    const calculateTotal = (item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return (qty * price).toFixed(2);
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
        <div className="border border-[#e7ebf3] dark:border-[#2a3447] rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f6f8] dark:bg-[#161f30] text-[#4c669a] dark:text-gray-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 w-20">Qty</th>
                <th className="px-4 py-3 w-32">Price (SAR)</th>
                <th className="px-4 py-3 w-32">Tax Exempt</th>
                <th className="px-4 py-3 w-32 text-right">Total</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebf3] dark:divide-[#2a3447] dark:text-white">
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400 italic">
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
                        placeholder="Enter item description..."
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
                        type="checkbox"
                        checked={item.taxExempt}
                        onChange={(e) =>
                          handleChangeLineItem(index, 'taxExempt', e.target.checked)
                        }
                        className="w-4 h-4 rounded border-[#e7ebf3] dark:border-[#2a3447] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
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
      const total = lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
      return total.toFixed(2);
    };
    const calculateVat = () => {
      const total = lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
      return (total * 0.15).toFixed(2);
    };
    const calculateGrandTotal = () => {
      const total = lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
      return (total * 1.15).toFixed(2);
    };  
    return(
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
                  if (!option) {
                    return;
                  }
                  // TODO: handle invoice actions here (option.value)
                }}
                options={[
                  { value: 'create', label: 'Create' },
                  { value: 'create-check-compliance', label: 'Create and Check Compliance' },
                  { value: 'create-report-zatca', label: 'Create and Report to ZATCA' },
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

