// Packages
import { Fragment, useMemo, useState, Suspense, use, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { ErrorBoundary } from 'react-error-boundary';
import { useAtomValue } from 'jotai';

// APIs
import { NotificationRecipientListRequest, NotificationRecipientDeleteRequest } from '../../../requests';

// Utils
import { auth, loginInfo } from '../../../atoms';
import { Footer, ErrorFallback, ConfirmModal } from '../../../components';
import { DEFAULT_PAGE_SIZE, PAGINATION_PAGE_SIZES, decodeString, parseLoginInfo, getNormalizedModulePermissions, showToast } from '../../../utils';

function NotificationRecipientList() {
  const navigate = useNavigate();
  const authValue = useAtomValue(auth);
  const loginInfoValue = useAtomValue(loginInfo);

  const user = useMemo(() => parseLoginInfo(loginInfoValue), [loginInfoValue]);
  const recipientPerms = useMemo(() => getNormalizedModulePermissions(user, 'notificationRecipient'), [user]);

  const [pagination, _pagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const [sorting, _sorting] = useState([]);
  const [searchQuery, _searchQuery] = useState('');
  const [appliedSearchQuery, _appliedSearchQuery] = useState('');
  const [isFilterOpen, _isFilterOpen] = useState(false);
  const [rowSelection, _rowSelection] = useState({});
  const [isBulkDeleteModalOpen, _isBulkDeleteModalOpen] = useState(false);
  const [reloadKey, _reloadKey] = useState(0);
  const [filters, _filters] = useState({ isActive: '' });

  const selectedRowCount = Object.keys(rowSelection).filter((key) => rowSelection[key]).length;

  const recipientsPromise = useMemo(() => {
    const decodedToken = decodeString(authValue);
    const params = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: appliedSearchQuery || undefined,
      sortBy: sorting.length > 0 ? sorting[0].id : undefined,
      sortOrder: sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
      isActive: filters.isActive !== '' ? filters.isActive === 'true' : undefined,
    };
    return NotificationRecipientListRequest(decodedToken, params);
  }, [authValue, pagination.pageIndex, pagination.pageSize, appliedSearchQuery, sorting, filters, reloadKey]);

  const handleFilterChange = (key, value) => _filters((prev) => ({ ...prev, [key]: value }));
  const resetFilters = () => { _filters({ isActive: '' }); _pagination((prev) => ({ ...prev, pageIndex: 0 })); };
  const applyFilters = () => { _pagination((prev) => ({ ...prev, pageIndex: 0 })); _isFilterOpen(false); };

  const TableLoadingSkeleton = () => (
    <div className="breeze-table-card">
      <div className="px-6 py-8 text-center text-sm text-[var(--z3c-subtle)]">
        <div className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin">sync</span>
          Loading recipients...
        </div>
      </div>
    </div>
  );

  const PAGE_HEADER = () => (
    <div>
      <h2 className="breeze-page__title">Notification Recipients</h2>
      <p className="breeze-page__lede">Manage email recipients for rejection notifications</p>
    </div>
  );

  const SEARCH_FILTERS_SECTION = () => (
    <div className="breeze-toolbar">
      <div className="breeze-search">
        <div className="breeze-field__control">
          <span className="material-symbols-outlined breeze-field__icon">search</span>
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => _searchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                _appliedSearchQuery(searchQuery);
                _pagination((prev) => ({ ...prev, pageIndex: 0 }));
              }
            }}
            className="breeze-input"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {selectedRowCount > 0 && recipientPerms.delete && (
          <button
            type="button"
            onClick={() => _isBulkDeleteModalOpen(true)}
            className="breeze-btn breeze-btn--danger-soft"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
            Delete ({selectedRowCount})
          </button>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => _isFilterOpen(!isFilterOpen)}
            className="breeze-btn breeze-btn--outline breeze-btn--inline w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            Filters
            <span className="material-symbols-outlined text-[16px]">{isFilterOpen ? 'expand_less' : 'expand_more'}</span>
          </button>

          {isFilterOpen && (
            <div className="breeze-panel">
              <div className="space-y-4">
                <div>
                  <label className="breeze-panel__label">Status</label>
                  <select
                    value={filters.isActive}
                    onChange={(e) => handleFilterChange('isActive', e.target.value)}
                    className="breeze-select"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2 border-t border-[var(--z3c-divider)]">
                  <button type="button" onClick={resetFilters} className="breeze-link flex-1">Reset</button>
                  <button type="button" onClick={applyFilters} className="breeze-btn breeze-btn--primary breeze-btn--inline flex-1">Apply</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {recipientPerms.create && (
          <button
            type="button"
            onClick={() => navigate('/notification-recipients/new')}
            className="breeze-btn breeze-btn--primary breeze-btn--inline w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Recipient
          </button>
        )}
      </div>
    </div>
  );

  const CONTENT = () => (
    <Fragment>
      <div className="breeze-page flex-1">
        {PAGE_HEADER()}
        {SEARCH_FILTERS_SECTION()}
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
          <Suspense fallback={<TableLoadingSkeleton />}>
            <RecipientsTableContent
              recipientsPromise={recipientsPromise}
              pagination={pagination}
              sorting={sorting}
              rowSelection={rowSelection}
              _sorting={_sorting}
              _pagination={_pagination}
              _rowSelection={_rowSelection}
              recipientPerms={recipientPerms}
              isBulkDeleteModalOpen={isBulkDeleteModalOpen}
              onBulkDeleteModalClose={() => _isBulkDeleteModalOpen(false)}
              onBulkDeleteComplete={() => {
                _isBulkDeleteModalOpen(false);
                _rowSelection({});
              }}
              refreshRecipients={() => _reloadKey((prev) => prev + 1)}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
      <Footer />
    </Fragment>
  );

  return (
    <div id="notification-recipient-list" className="flex min-h-0 flex-1 flex-col">
      {CONTENT()}
    </div>
  );
}

function RecipientsTableContent({
  recipientsPromise,
  pagination,
  sorting,
  rowSelection,
  _pagination,
  _sorting,
  _rowSelection,
  recipientPerms,
  isBulkDeleteModalOpen,
  onBulkDeleteModalClose,
  onBulkDeleteComplete,
  refreshRecipients,
}) {
  const navigate = useNavigate();
  const authValue = useAtomValue(auth);
  const decodedToken = useMemo(() => decodeString(authValue), [authValue]);
  const [isDeleting, _isDeleting] = useState(false);
  const response = use(recipientsPromise);
  const data = Array.isArray(response?.data) ? response.data : Array.isArray(response?.data?.data) ? response.data.data : [];
  const meta = response?.meta ?? response?.data?.meta ?? {};
  const total = meta.total ?? 0;
  const page = meta.page ?? 1;
  const limit = meta.limit ?? DEFAULT_PAGE_SIZE;
  const totalPages = meta.totalPages ?? (Math.ceil(total / limit) || 1);

  const paginationInfo = {
    totalCount: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  const handleRowClick = useCallback((row, event) => {
    if (!recipientPerms.update || !row.original?._id) return;
    if (event.target.closest('input[type="checkbox"]') || event.target.closest('a')) return;

    navigate(`/notification-recipients/${row.original._id}`);
  }, [recipientPerms.update, navigate]);

  const handleCloseBulkDeleteModal = () => {
    if (isDeleting) return;
    onBulkDeleteModalClose?.();
  };

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="breeze-check__box"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="breeze-check__box"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        enableSorting: true,
        cell: ({ getValue }) => (
          <a
            href={`mailto:${getValue()}`}
            onClick={(e) => e.stopPropagation()}
            className="text-primary hover:underline"
          >
            {getValue()}
          </a>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        cell: ({ getValue }) => <span>{getValue() || '—'}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        enableSorting: true,
        cell: ({ getValue }) => {
          const isActive = getValue();
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isActive
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isActive ? 'bg-green-600 dark:bg-green-400' : 'bg-red-600 dark:bg-red-400'
              }`}></span>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        enableSorting: true,
        cell: ({ getValue }) => <span className="text-xs">{getValue()}</span>,
      },
    ],
    []
  );

  const table = useReactTable({
    data: data.length > 0 ? data : [],
    columns,
    getRowId: (row) => row._id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: _sorting,
    onRowSelectionChange: _rowSelection,
    onPaginationChange: _pagination,
    manualPagination: true,
    pageCount: paginationInfo.totalPages,
    state: { sorting, rowSelection, pagination },
    enableRowSelection: true,
  });

  const handleConfirmBulkDelete = useCallback(() => {
    const selectedRows = table.getSelectedRowModel().rows;
    const deletableRecipients = selectedRows
      .map((row) => row.original)
      .filter((recipient) => recipientPerms.delete && recipient.isActive && recipient._id);

    if (deletableRecipients.length === 0) {
      showToast('No active recipients selected for deletion', 'error');
      return;
    }

    _isDeleting(true);
    Promise.all(deletableRecipients.map((recipient) => NotificationRecipientDeleteRequest(decodedToken, recipient._id)))
      .then(() => {
        showToast(
          deletableRecipients.length === 1
            ? 'Recipient deleted successfully!'
            : `${deletableRecipients.length} recipients deleted successfully!`,
          'success'
        );
        onBulkDeleteComplete?.();
        refreshRecipients?.();
      })
      .catch((err) => {
        showToast(err?.message || 'Failed to delete selected recipients', 'error');
      })
      .finally(() => {
        _isDeleting(false);
      });
  }, [decodedToken, onBulkDeleteComplete, recipientPerms.delete, refreshRecipients, table]);

  const RECIPIENT_TABLE = () => (
    <div className="overflow-x-auto">
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`${
                    header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                  } ${header.id === 'select' ? 'w-12' : ''}`}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <span className="material-symbols-outlined text-[16px]">
                        {{ asc: 'arrow_upward', desc: 'arrow_downward' }[header.column.getIsSorted()] || 'unfold_more'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="!text-center text-[var(--z3c-subtle)]">
                No notification recipients found
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={(event) => handleRowClick(row, event)}
                className={`${row.getIsSelected() ? 'is-selected' : ''} ${recipientPerms.update ? 'cursor-pointer' : ''}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cell.column.id === 'select' ? 'w-12' : ''}
                  >
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
    <div className="breeze-pager">
      <div className="breeze-pager__size">
        <span>Showing</span>
        <select
          value={pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="breeze-select"
          aria-label="Rows per page"
        >
          {PAGINATION_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div className="breeze-pager__nav">
        <button
          type="button"
          onClick={() => table.setPageIndex(0)}
          disabled={!paginationInfo.hasPreviousPage}
          className="breeze-pagebtn"
          aria-label="First page"
        >
          <span className="material-symbols-outlined">first_page</span>
        </button>
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!paginationInfo.hasPreviousPage}
          className="breeze-pagebtn"
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
            let pageNum;
            if (paginationInfo.totalPages <= 5) pageNum = i + 1;
            else if (pagination.pageIndex + 1 <= 3) pageNum = i + 1;
            else if (pagination.pageIndex + 1 >= paginationInfo.totalPages - 2) pageNum = paginationInfo.totalPages - 4 + i;
            else pageNum = pagination.pageIndex - 1 + i;
            return (
              <button
                type="button"
                key={pageNum}
                onClick={() => table.setPageIndex(pageNum - 1)}
                className={`breeze-pagebtn ${pagination.pageIndex + 1 === pageNum ? 'is-current' : ''}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!paginationInfo.hasNextPage}
          className="breeze-pagebtn"
          aria-label="Next page"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
        <button
          type="button"
          onClick={() => table.setPageIndex(paginationInfo.totalPages - 1)}
          disabled={!paginationInfo.hasNextPage}
          className="breeze-pagebtn"
          aria-label="Last page"
        >
          <span className="material-symbols-outlined">last_page</span>
        </button>
      </div>
    </div>
  );

  const CONFIRM_BULK_DELETE_MODAL = () => (
    <ConfirmModal
      isOpen={isBulkDeleteModalOpen}
      title="Delete selected recipients"
      description="Are you sure you want to delete the selected recipients? Only active recipients will be removed. This action cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onConfirm={handleConfirmBulkDelete}
      onCancel={handleCloseBulkDeleteModal}
      isConfirming={isDeleting}
    />
  );

  return (
    <div className="breeze-table-card">
      {RECIPIENT_TABLE()}
      {PAGINATION_SECTION()}
      {CONFIRM_BULK_DELETE_MODAL()}
    </div>
  );
}

export default NotificationRecipientList;
