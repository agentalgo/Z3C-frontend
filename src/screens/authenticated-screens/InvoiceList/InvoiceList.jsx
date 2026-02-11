// Packages
import { Fragment, useMemo, useState, Suspense, use, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { ErrorBoundary } from 'react-error-boundary';
import { useAtomValue } from 'jotai';

// APIs
import { InvoiceListRequest, InvoiceDeleteRequest } from '../../../requests';

// Utils 
import { auth } from '../../../atoms';
import { Footer, ErrorFallback, ConfirmModal } from '../../../components';
import { DEFAULT_PAGE_SIZE, PAGINATION_PAGE_SIZES, decodeString, showToast } from '../../../utils';

function InvoiceList() {
  const navigate = useNavigate();
  const authValue = useAtomValue(auth);

  const [pagination, _pagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [sorting, _sorting] = useState([]);
  const [searchQuery, _searchQuery] = useState('');
  const [appliedSearchQuery, _appliedSearchQuery] = useState('');
  const [isFilterOpen, _isFilterOpen] = useState(false);
  const [isActionsOpen, _isActionsOpen] = useState(false);
  const [rowSelection, _rowSelection] = useState({});
  const [reloadKey, _reloadKey] = useState(0);

  // Filters state
  const [filters, _filters] = useState({
    zatcaStatus: '',
    type: '',
    invoicePaid: '',
  });

  const invoicesPromise = useMemo(() => {
    const decodedToken = decodeString(authValue);
    const params = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: appliedSearchQuery || undefined,
      sortBy: sorting.length > 0 ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}` : undefined,
      zatcaStatus: filters.zatcaStatus || undefined,
      type: filters.type || undefined,
      invoicePaid: filters.invoicePaid || undefined,
    };

    return InvoiceListRequest(decodedToken, params);
  }, [authValue, pagination.pageIndex, pagination.pageSize, appliedSearchQuery, sorting, filters, reloadKey]);

  const selectedRowCount = Object.keys(rowSelection).length;

  // *********** Handlers ***********

  const handleFilterChange = (key, value) => {
    _filters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    _filters({
      zatcaStatus: '',
      type: '',
      invoicePaid: '',
    });
    _pagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const applyFilters = () => {
    _pagination((prev) => ({ ...prev, pageIndex: 0 }));
    _isFilterOpen(false);
  };

  // *********** Render Functions ***********

  const TableLoadingSkeleton = () => (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] shadow-sm overflow-hidden">
      <div className="px-6 py-8 text-center text-sm text-[#4c669a]">
        <div className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin">sync</span>
          Loading Invoices...
        </div>
      </div>
    </div>
  );

  const PAGE_HEADER = () => (
    <div className="flex flex-wrap justify-between items-end gap-4">
      <div className="space-y-1">
        <h2 className="text-[#0d121b] dark:text-white text-3xl font-black tracking-tight">
          Invoices
        </h2>
        <p className="text-[#4c669a] text-base">Manage and track your electronic invoices</p>
      </div>
    </div>
  );

  const SEARCH_FILTERS_SECTION = () => (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c669a] text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => _searchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                _appliedSearchQuery(searchQuery);
                _pagination((prev) => ({ ...prev, pageIndex: 0 }));
              }
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white placeholder:text-[#4c669a] focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {selectedRowCount > 0 && (
          <div className="relative">
            <button
              onClick={() => _isActionsOpen(!isActionsOpen)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary bg-primary/10 text-sm font-medium text-primary hover:bg-primary/20 transition-colors w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-[20px]">checklist</span>
              Actions ({selectedRowCount})
              <span className="material-symbols-outlined text-[16px]">
                {isActionsOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isActionsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#161f30] rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] shadow-lg z-20">
                <div className="py-1">
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Submit to ZATCA
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                    Send Email
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Export Selected
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    Print
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => _isFilterOpen(!isFilterOpen)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm font-medium text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            Filters
            <span className="material-symbols-outlined text-[16px]">
              {isFilterOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#161f30] rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] shadow-lg z-20">
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-wider">ZATCA Status</label>
                  <select
                    value={filters.zatcaStatus}
                    onChange={(e) => handleFilterChange('zatcaStatus', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#0f1323] text-sm text-[#0d121b] dark:text-white py-2 px-3"
                  >
                    <option value="">All</option>
                    <option value="CLEARED">Cleared</option>
                    <option value="REPORTED">Reported</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-wider">Invoice Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#0f1323] text-sm text-[#0d121b] dark:text-white py-2 px-3"
                  >
                    <option value="">All</option>
                    <option value="B2B">B2B</option>
                    <option value="B2C">B2C</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-wider">Payment Status</label>
                  <select
                    value={filters.invoicePaid}
                    onChange={(e) => handleFilterChange('invoicePaid', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#0f1323] text-sm text-[#0d121b] dark:text-white py-2 px-3"
                  >
                    <option value="">All</option>
                    <option value="Yes">Paid</option>
                    <option value="No">Unpaid</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2 border-t border-[#e7ebf3] dark:border-[#2a3447]">
                  <button
                    onClick={resetFilters}
                    className="flex-1 px-3 py-2 text-sm font-medium text-[#4c669a] hover:text-[#0d121b] dark:hover:text-white transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={applyFilters}
                    className="flex-1 px-3 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/invoices/new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 w-full sm:w-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create
        </button>
      </div>
    </div>
  );

  const CONTENT = () => (
    <Fragment>
      <div className="p-8 space-y-6">
        {PAGE_HEADER()}
        {SEARCH_FILTERS_SECTION()}
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
          <Suspense fallback={<TableLoadingSkeleton />}>
            <InvoicesTableContent
              invoicesPromise={invoicesPromise}
              pagination={pagination}
              _pagination={_pagination}
              sorting={sorting}
              _sorting={_sorting}
              rowSelection={rowSelection}
              _rowSelection={_rowSelection}
              refreshInvoices={() => _reloadKey((prev) => prev + 1)}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
      <Footer />
    </Fragment>
  );

  return (<div id="invoice-list">{CONTENT()}</div>);
}

function InvoicesTableContent({
  invoicesPromise,
  pagination,
  _pagination,
  sorting,
  _sorting,
  rowSelection,
  _rowSelection,
  refreshInvoices,
}) {
  const navigate = useNavigate();
  const authValue = useAtomValue(auth);
  const decodedToken = useMemo(() => decodeString(authValue), [authValue]);
  const response = use(invoicesPromise);
  const data = response?.data || [];
  const meta = response?.meta || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };

  const paginationInfo = {
    totalCount: meta.total,
    totalPages: meta.totalPages,
    hasNextPage: meta.page < meta.totalPages,
    hasPreviousPage: meta.page > 1,
  };

  const [isDeleteModalOpen, _isDeleteModalOpen] = useState(false);
  const [selectedInvoiceId, _selectedInvoiceId] = useState(null);
  const [isDeleting, _isDeleting] = useState(false);

  // *********** Handlers ***********

  const handleOpenDeleteModal = (invoiceId) => {
    if (!invoiceId) return;
    _selectedInvoiceId(invoiceId);
    _isDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    _isDeleteModalOpen(false);
    _selectedInvoiceId(null);
  };

  const handleConfirmDelete = useCallback(() => {
    if (!selectedInvoiceId) return;

    _isDeleting(true);
    InvoiceDeleteRequest(decodedToken, selectedInvoiceId)
      .then(() => {
        showToast('Invoice deleted successfully!', 'success');
        handleCloseDeleteModal();
        refreshInvoices?.();
      })
      .catch((err) => {
        showToast(err?.message || 'Failed to delete invoice', 'error');
      })
      .finally(() => {
        _isDeleting(false);
      });
  }, [decodedToken, selectedInvoiceId, refreshInvoices]);

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4 rounded border-[#e7ebf3] dark:border-[#2a3447] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 rounded border-[#e7ebf3] dark:border-[#2a3447] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice No.',
        enableSorting: true,
      },
      {
        accessorKey: 'referenceNumber',
        header: 'Reference No.',
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: true,
        cell: ({ getValue }) => {
          const status = getValue();
          const statusColors = {
            CLEARED: 'bg-green-100 text-green-700',
            REPORTED: 'bg-blue-100 text-blue-700',
            REJECTED: 'bg-red-100 text-red-700',
            PENDING: 'bg-amber-100 text-amber-700',
            DRAFT: 'bg-gray-100 text-gray-700',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: 'paymentTerms',
        header: 'Payment Term',
        enableSorting: true,
      },
      {
        accessorKey: 'emailSentCounter',
        header: 'Emails Sent',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">mail</span>
            {getValue() || 0}
          </span>
        ),
      },
      {
        accessorKey: 'invoicePaid',
        header: 'Invoice Paid',
        enableSorting: true,
        cell: ({ getValue }) => {
          const paid = getValue();
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${paid === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {paid}
            </span>
          );
        },
      },
      {
        accessorKey: 'invoiceType',
        header: 'Type',
        enableSorting: true,
      },
      {
        id: 'customerName',
        header: 'Customer',
        enableSorting: true,
        cell: ({ row }) => row.original.customerId?.registrationName || 'N/A'
      },
      {
        id: 'createdBy',
        header: 'Created By',
        enableSorting: true,
        cell: ({ row }) => row.original.createdBy?.username || 'N/A'
      },
      {
        accessorKey: 'grandTotal',
        header: 'Grand Total',
        enableSorting: true,
        cell: ({ getValue, row }) => {
          const currency = row.original.currency || 'SAR';
          return <span className="font-bold">{getValue()?.toLocaleString()} {currency}</span>;
        },
      },
      {
        accessorKey: 'paymentType',
        header: 'Payment Type',
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/invoices/${row.original._id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#161f30] border border-[#e7ebf3] dark:border-[#2a3447] text-xs font-semibold text-[#4c669a] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit
            </button>
            <button
              onClick={() => handleOpenDeleteModal(row.original._id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#161f30] border border-red-200 dark:border-red-500/60 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Delete
            </button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [navigate, handleOpenDeleteModal]
  );

  const table = useReactTable({
    data: data.length > 0 ? data : [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: _sorting,
    onRowSelectionChange: _rowSelection,
    onPaginationChange: _pagination,
    manualPagination: true,
    pageCount: paginationInfo.totalPages,
    state: {
      sorting,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
  });

  // *********** Render Functions ***********

  const INVOICES_TABLE = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[1400px]">
        <thead className="bg-[#f8f9fc] dark:bg-[#1a253a] text-[#4c669a] dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`px-6 py-4 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800' : ''} transition-colors ${header.id === 'select' ? 'w-12' : ''}`}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <span className="material-symbols-outlined text-[16px]">
                        {{
                          asc: 'arrow_upward',
                          desc: 'arrow_downward',
                        }[header.column.getIsSorted()] || 'unfold_more'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-[#e7ebf3] dark:divide-[#2a3447]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-[#4c669a]">
                No invoices found
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${row.getIsSelected() ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={`px-6 py-4 text-sm text-[#0d121b] dark:text-white ${cell.column.id === 'select' ? 'w-12' : ''}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const PAGINATION_SECTION = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-[#f8f9fc] dark:bg-[#1a253a] border-t border-[#e7ebf3] dark:border-[#2a3447]">
      <div className="flex items-center gap-2 text-sm text-[#4c669a] dark:text-gray-400">
        <span>Showing</span>
        <select
          value={pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          className="px-2 py-1 rounded border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-[#0d121b] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {PAGINATION_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!paginationInfo.hasPreviousPage}
          className="px-3 py-1.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">first_page</span>
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!paginationInfo.hasPreviousPage}
          className="px-3 py-1.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
            let pageNum;
            if (paginationInfo.totalPages <= 5) {
              pageNum = i + 1;
            } else if (pagination.pageIndex + 1 <= 3) {
              pageNum = i + 1;
            } else if (pagination.pageIndex + 1 >= paginationInfo.totalPages - 2) {
              pageNum = paginationInfo.totalPages - 4 + i;
            } else {
              pageNum = pagination.pageIndex - 1 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => table.setPageIndex(pageNum - 1)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pagination.pageIndex + 1 === pageNum
                  ? 'bg-primary text-white'
                  : 'border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => table.nextPage()}
          disabled={!paginationInfo.hasNextPage}
          className="px-3 py-1.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
        <button
          onClick={() => table.setPageIndex(paginationInfo.totalPages - 1)}
          disabled={!paginationInfo.hasNextPage}
          className="px-3 py-1.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">last_page</span>
        </button>
      </div>
    </div>
  );

  const CONFIRM_DELETE_MODAL = () => (
    <ConfirmModal
      isOpen={isDeleteModalOpen}
      title="Delete invoice"
      description="Are you sure you want to delete this invoice? This action cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onConfirm={handleConfirmDelete}
      onCancel={handleCloseDeleteModal}
      isConfirming={isDeleting}
    />
  );

  return (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] shadow-sm overflow-hidden">
      {INVOICES_TABLE()}
      {PAGINATION_SECTION()}
      {CONFIRM_DELETE_MODAL()}
    </div>
  );
}

export default InvoiceList;
