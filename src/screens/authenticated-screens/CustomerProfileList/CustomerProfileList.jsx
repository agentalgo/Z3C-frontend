// Packages
import { Fragment, Suspense, useMemo, useState, use } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { ErrorBoundary } from 'react-error-boundary';
import { useAtomValue } from 'jotai';

// APIs
import { CustomerProfileListRequest } from '../../../requests';

// Utils
import { auth, loginInfo } from '../../../atoms';
import { Footer, ErrorFallback } from '../../../components';
import { DEFAULT_PAGE_SIZE, PAGINATION_PAGE_SIZES, decodeString, parseLoginInfo, getNormalizedModulePermissions } from '../../../utils';

const INVOICE_TYPE_FILTERS = ['B2B', 'SIMPLIFIED', 'CREDIT_NOTE', 'DEBIT_NOTE'];

function CustomerProfileList() {
  const navigate = useNavigate();
  const authValue = useAtomValue(auth);
  const loginInfoValue = useAtomValue(loginInfo);

  const user = useMemo(() => parseLoginInfo(loginInfoValue), [loginInfoValue]);
  const customerProfilePerms = useMemo(
    () => getNormalizedModulePermissions(user, 'profile'),
    [user]
  );

  const [pagination, _pagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [sorting, _sorting] = useState([]);
  const [searchQuery, _searchQuery] = useState('');
  const [appliedSearchQuery, _appliedSearchQuery] = useState('');
  const [isFilterOpen, _isFilterOpen] = useState(false);
  const [rowSelection, _rowSelection] = useState({});
  const [reloadKey, _reloadKey] = useState(0);

  // Filters state
  const [filters, _filters] = useState({
    isActive: '',
    invoiceType: '',
  });

  const profilesPromise = useMemo(() => {
    const decodedToken = decodeString(authValue);
    const params = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: appliedSearchQuery || undefined,
      sortBy: sorting.length > 0 ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}` : undefined,
      isActive: filters.isActive !== '' ? filters.isActive === 'true' : undefined,
      invoiceType: filters.invoiceType || undefined,
    };

    if (!decodedToken) {
      return Promise.resolve({
        data: [],
        meta: {
          total: 0,
          page: params.page || 1,
          limit: params.limit || DEFAULT_PAGE_SIZE,
          totalPages: 0,
        },
      });
    }

    return CustomerProfileListRequest(decodedToken, params);
  }, [authValue, pagination.pageIndex, pagination.pageSize, appliedSearchQuery, sorting, filters, reloadKey]);

  // *********** Handlers ***********

  const handleFilterChange = (key, value) => {
    _filters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    _filters({ isActive: '', invoiceType: '' });
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
          Loading Customer Profiles...
        </div>
      </div>
    </div>
  );

  const PAGE_HEADER = () => (
    <div className="flex flex-wrap justify-between items-end gap-4">
      <div className="space-y-1">
        <h2 className="text-[#0d121b] dark:text-white text-3xl font-black tracking-tight">
          Customer Profiles
        </h2>
        <p className="text-[#4c669a] text-base">
          Manage customer profile defaults and bank details
        </p>
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
            placeholder="Search customer profiles..."
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
            <div className="absolute right-0 mt-2 z-30 w-64 bg-white dark:bg-[#161f30] rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] shadow-lg">
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-wider">Status</label>
                  <select
                    value={filters.isActive}
                    onChange={(e) => handleFilterChange('isActive', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#0f1323] text-sm text-[#0d121b] dark:text-white py-2 px-3"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-wider">Invoice type</label>
                  <select
                    value={filters.invoiceType}
                    onChange={(e) => handleFilterChange('invoiceType', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#0f1323] text-sm text-[#0d121b] dark:text-white py-2 px-3"
                  >
                    <option value="">All</option>
                    {INVOICE_TYPE_FILTERS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
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

        {customerProfilePerms.create && (
          <button
            onClick={() => navigate('/customer-profile/new')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Create Profile
          </button>
        )}
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
            <CustomerProfilesTableContent
              profilesPromise={profilesPromise}
              pagination={pagination}
              sorting={sorting}
              rowSelection={rowSelection}
              _sorting={_sorting}
              _pagination={_pagination}
              _rowSelection={_rowSelection}
              refreshProfiles={() => _reloadKey((prev) => prev + 1)}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
      <Footer />
    </Fragment>
  );

  return (
    <div id="customer-profile-list">
      {CONTENT()}
    </div>
  );
}

function CustomerProfilesTableContent({
  profilesPromise,
  pagination,
  sorting,
  rowSelection,
  _pagination,
  _sorting,
  _rowSelection,
}) {
  const navigate = useNavigate();
  const loginInfoValue = useAtomValue(loginInfo);
  const user = useMemo(() => parseLoginInfo(loginInfoValue), [loginInfoValue]);
  const customerProfilePerms = useMemo(
    () => getNormalizedModulePermissions(user, 'profile'),
    [user]
  );
  const response = use(profilesPromise);
  // API returns { data: [...] | { data: [], meta }, meta: { total, page, limit, totalPages } }
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
        accessorKey: 'name',
        header: 'Profile Name',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() || '-'}</span>
        ),
      },
      {
        accessorKey: 'invoiceType',
        header: 'Invoice Type',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span>{getValue() || '-'}</span>
        ),
      },
      {
        accessorKey: 'paymentTerms',
        header: 'Payment Terms',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span>{getValue() || '-'}</span>
        ),
      },
      {
        id: 'bankSummary',
        header: 'Bank Summary',
        cell: ({ row }) => {
          const bank = row.original.bankDetails || {};
          return (
            <div className="flex flex-col text-xs">
              <span className="font-semibold">{bank.bankName || '-'}</span>
              <span className="text-[#4c669a]">
                {bank.accountName || ''}{bank.accountName && bank.accountNumber ? ' • ' : ''}{bank.accountNumber || ''}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-xs">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated At',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-xs">{getValue()}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          if (!customerProfilePerms.update) return null;

          const handleChange = (e) => {
            const value = e.target.value;
            if (!value) return;

            if (value === 'edit') {
              navigate(`/customer-profile/${row.original._id}`);
            }

            e.target.value = '';
          };

          return (
            <select
              defaultValue=""
              onChange={handleChange}
              className="px-3 py-1.5 text-sm rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
            >
              <option value="" disabled>
                Action
              </option>
              <option value="edit">Edit</option>
            </select>
          );
        },
        enableSorting: false,
      },
    ],
    [navigate, customerProfilePerms]
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

  const PROFILES_TABLE = () => (
    <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
        <thead className="bg-[#f8f9fc] dark:bg-[#1a253a] text-[#4c669a] dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`px-6 py-4 ${
                    header.column.getCanSort()
                      ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800'
                      : ''
                  } transition-colors ${header.id === 'select' ? 'w-12' : ''} ${
                    header.id === 'actions'
                      ? 'sticky right-0 bg-[#f8f9fc] dark:bg-[#1a253a] z-20 w-32 text-right'
                      : ''
                  }`}
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
                No customer profiles found
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${row.getIsSelected() ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-6 py-4 text-sm text-[#0d121b] dark:text-white ${
                      cell.column.id === 'select' ? 'w-12' : ''
                    } ${
                      cell.column.id === 'actions'
                        ? 'sticky right-0 bg-white dark:bg-[#161f30] z-10 w-32 text-right'
                        : ''
                    }`}
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pagination.pageIndex + 1 === pageNum
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

  return (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] shadow-sm overflow-hidden">
      {PROFILES_TABLE()}
      {PAGINATION_SECTION()}
    </div>
  );
}

export default CustomerProfileList;

