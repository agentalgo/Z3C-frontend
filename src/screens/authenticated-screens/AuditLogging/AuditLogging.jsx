// Packages
import { Fragment, useMemo, useState, useRef, Suspense, use, useEffect } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { ErrorBoundary } from 'react-error-boundary';
import Select from 'react-select';
import { useAtomValue } from 'jotai';

// APIs
import { AuditListRequest, UserListRequest } from '../../../requests';

// Utils
import { auth } from '../../../atoms';
import { Footer, ErrorFallback } from '../../../components';
import { DEFAULT_PAGE_SIZE, PAGINATION_PAGE_SIZES, decodeString } from '../../../utils';

const DETAILS_TRUNCATE_LEN = 80;
const DETAILS_SEP = ' · ';

function getMergedDetails(row) {
  if (!row) return '';
  const { activityDescription, newValue } = row;
  const parts = [];
  // if (activityName != null && String(activityName).trim()) parts.push(String(activityName).trim());
  if (activityDescription != null && String(activityDescription).trim()) parts.push(String(activityDescription).trim());
  if (newValue != null) {
    const v = typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue);
    if (v.trim()) parts.push(v.trim());
  }
  if (parts.length === 0) {
    const fallback = row.details ?? row.metadata ?? row.extra ?? '';
    return typeof fallback === 'string' ? fallback : JSON.stringify(fallback);
  }
  return parts.join(DETAILS_SEP);
}

function formatTimestamp(value) {
  if (!value) return '-';
  try {
    const d = new Date(value);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(',', '');
  } catch {
    return String(value);
  }
}

function toISOStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toISOEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function AuditLogging() {
  const authValue = useAtomValue(auth);
  const [pagination, _pagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [sorting, _sorting] = useState([{ id: 'createdAt', desc: true }]);
  const [searchQuery, _searchQuery] = useState('');
  const [appliedSearchQuery, _appliedSearchQuery] = useState('');
  const [fromDate, _fromDate] = useState('');
  const [toDate, _toDate] = useState('');
  const [selectedUserId, _selectedUserId] = useState(null);
  const [selectedModule, _selectedModule] = useState(null);
  const [selectedAction, _selectedAction] = useState(null);
  const [moduleOptions, _moduleOptions] = useState([]);
  const [actionOptions, _actionOptions] = useState([]);
  const [filterDrawerOpen, _filterDrawerOpen] = useState(false);
  const [detailsModal, _detailsModal] = useState(null);
  const [reloadKey, _reloadKey] = useState(0);

  // Fetch users list once per mount for the filter dropdown.
  // Stored in a ref so it never gets recreated on re-renders.
  const usersPromiseRef = useRef(null);
  if (usersPromiseRef.current === null) {
    const token = decodeString(authValue);
    usersPromiseRef.current = token
      ? UserListRequest(token, { limit: 200 })
      : Promise.resolve({ data: [] });
  }

  const auditPromise = useMemo(() => {
    const decodedToken = decodeString(authValue);
    if (!decodedToken) return Promise.resolve({ data: [], total: 0, page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 0 });

    const sort = sorting.length > 0 ? sorting[0] : { id: 'createdAt', desc: true };
    const params = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: appliedSearchQuery || undefined,
      sortBy: sort.id,
      sortOrder: sort.desc ? 'desc' : 'asc',
      userId: selectedUserId?.value || undefined,
      entityType: selectedModule?.value || undefined,
      action: selectedAction?.value || undefined,
      fromDate: fromDate ? toISOStartOfDay(fromDate) : undefined,
      toDate: toDate ? toISOEndOfDay(toDate) : undefined,
    };

    return AuditListRequest(decodedToken, params);
  }, [authValue, pagination.pageIndex, pagination.pageSize, appliedSearchQuery, sorting, fromDate, toDate, selectedUserId, selectedModule, selectedAction, reloadKey]);

  const TableLoadingSkeleton = () => (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] shadow-sm overflow-hidden">
      <div className="px-6 py-8 text-center text-sm text-[#4c669a]">
        <div className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin">sync</span>
          Loading audit logs...
        </div>
      </div>
    </div>
  );

  const PAGE_HEADER = () => (
    <div className="flex flex-wrap justify-between items-end gap-4">
      <div className="space-y-1">
        <h2 className="text-[#0d121b] dark:text-white text-3xl font-black tracking-tight">
          Audit Logging
        </h2>
        <p className="text-[#4c669a] text-base">View and filter system audit logs</p>
      </div>
    </div>
  );

  const applySearch = () => {
    _appliedSearchQuery(searchQuery);
    _pagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const clearFilters = () => {
    _fromDate('');
    _toDate('');
    _selectedUserId(null);
    _selectedModule(null);
    _selectedAction(null);
    _searchQuery('');
    _appliedSearchQuery('');
    _pagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const selectControlStyles = {
    control: (base) => ({
      ...base,
      minHeight: 42,
      borderColor: 'var(--border, #e7ebf3)',
      borderRadius: 8,
    }),
  };

  const FILTERS_SECTION = () => (
    <div className="flex flex-wrap items-center gap-2 justify-between">
      <div className="relative min-w-[180px] max-w-sm w-full sm:w-auto sm:max-w-[280px]">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c669a] text-[20px]">search</span>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => _searchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applySearch()}
          className="w-full h-[42px] pl-10 pr-4 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white placeholder:text-[#4c669a] focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => _filterDrawerOpen(true)}
          className="inline-flex items-center justify-center gap-2 h-[42px] px-4 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
          title="Filters"
        >
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
          Filters
          {(selectedUserId || selectedModule || selectedAction || fromDate || toDate || appliedSearchQuery) && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold px-1.5">
              •
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => _reloadKey((k) => k + 1)}
          className="flex items-center justify-center h-[42px] w-[42px] rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          title="Refresh"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </div>
    </div>
  );

  const FILTER_DRAWER = () => (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${filterDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => _filterDrawerOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-[#161f30] border-l border-[#e7ebf3] dark:border-[#2a3447] shadow-xl flex flex-col transition-transform duration-200 ease-out ${
          filterDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7ebf3] dark:border-[#2a3447]">
          <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Filters</h3>
          <button
            type="button"
            onClick={() => _filterDrawerOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[#0d121b] dark:text-white transition-colors"
            aria-label="Close filters"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#4c669a] dark:text-gray-400">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                _fromDate(e.target.value);
                _pagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className="px-3 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#4c669a] dark:text-gray-400">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                _toDate(e.target.value);
                _pagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className="px-3 py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="w-full">
            <Suspense fallback={<div className="h-[42px] rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-[#f8f9fc] dark:bg-[#1a253a]" />}>
              <UserFilterAsync
                usersPromise={usersPromiseRef.current}
                selectedUserId={selectedUserId}
                _selectedUserId={_selectedUserId}
                onApply={() => _pagination((prev) => ({ ...prev, pageIndex: 0 }))}
              />
            </Suspense>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#4c669a] dark:text-gray-400 block mb-1">Filter by Module</label>
            <Select
              placeholder="All modules"
              isClearable
              value={selectedModule}
              onChange={(v) => {
                _selectedModule(v);
                _pagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              options={moduleOptions}
              classNamePrefix="react-select"
              styles={selectControlStyles}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#4c669a] dark:text-gray-400 block mb-1">Filter by Action</label>
            <Select
              placeholder="All actions"
              isClearable
              value={selectedAction}
              onChange={(v) => {
                _selectedAction(v);
                _pagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              options={actionOptions}
              classNamePrefix="react-select"
              styles={selectControlStyles}
            />
          </div>
        </div>
        <div className="p-6 border-t border-[#e7ebf3] dark:border-[#2a3447] flex flex-col gap-2">
          <button
            type="button"
            onClick={() => _filterDrawerOpen(false)}
            className="w-full py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Done
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="w-full py-2.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-[#0d121b] dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>
    </>
  );

  const CONTENT = () => (
    <Fragment>
      {FILTER_DRAWER()}
      <div className="p-8 space-y-6">
        {PAGE_HEADER()}
        {FILTERS_SECTION()}
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
          <Suspense fallback={<TableLoadingSkeleton />}>
            <AuditTableContent
              auditPromise={auditPromise}
              usersPromise={usersPromiseRef.current}
              pagination={pagination}
              sorting={sorting}
              _sorting={_sorting}
              _pagination={_pagination}
              onDetails={(row) => _detailsModal(row)}
              onAuditDataLoaded={(data) => {
                const modules = [...new Set((data || []).map((r) => r.entityType).filter(Boolean))];
                const actions = [...new Set((data || []).map((r) => r.action).filter(Boolean))];
                _moduleOptions((prev) => {
                  const byValue = new Map(prev.map((o) => [o.value, o]));
                  modules.forEach((m) => { if (!byValue.has(m)) byValue.set(m, { value: m, label: m }); });
                  return [...byValue.values()].sort((a, b) => (a.label || '').localeCompare(b.label || ''));
                });
                _actionOptions((prev) => {
                  const byValue = new Map(prev.map((o) => [o.value, o]));
                  actions.forEach((a) => { if (!byValue.has(a)) byValue.set(a, { value: a, label: a }); });
                  return [...byValue.values()].sort((a, b) => (a.label || '').localeCompare(b.label || ''));
                });
              }}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
      <Footer />
      {detailsModal != null && (
        <DetailsModal
          row={detailsModal}
          onClose={() => _detailsModal(null)}
        />
      )}
    </Fragment>
  );

  return (
    <div id="audit-logging">
      {CONTENT()}
    </div>
  );
}

function UserFilterAsync({ usersPromise, selectedUserId, _selectedUserId, onApply }) {
  const res = use(usersPromise);
  const options = useMemo(() => {
    const list = res?.data || [];
    return list.map((u) => ({
      value: u._id,
      label: u.username || u.email || u._id,
    }));
  }, [res]);

  return (
    <Fragment>
      <label className="text-xs font-medium text-[#4c669a] dark:text-gray-400 block mb-1">Filter by User</label>
      <Select
        placeholder="All users"
        isClearable
        value={selectedUserId}
        onChange={(v) => {
          _selectedUserId(v);
          onApply?.();
        }}
        options={options}
        classNamePrefix="react-select"
        styles={{
          control: (base) => ({
            ...base,
            minHeight: 42,
            borderColor: 'var(--border, #e7ebf3)',
            borderRadius: 8,
          }),
        }}
      />
    </Fragment>
  );
}

function DetailsModal({ row, onClose }) {
  const str = getMergedDetails(row);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7ebf3] dark:border-[#2a3447]">
          <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[#0d121b] dark:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-auto flex-1">
          <pre className="text-xs text-[#0d121b] dark:text-gray-300 whitespace-pre-wrap break-words font-mono">
            {str || 'No details'}
          </pre>
        </div>
      </div>
    </div>
  );
}

function AuditTableContent({ auditPromise, usersPromise, pagination, sorting, _sorting, _pagination, onDetails, onAuditDataLoaded }) {
  const response = use(auditPromise);
  const usersResponse = use(usersPromise);
  const data = response?.data ?? [];
  const onAuditDataLoadedRef = useRef(onAuditDataLoaded);
  onAuditDataLoadedRef.current = onAuditDataLoaded;
  useEffect(() => {
    if (data.length > 0 && onAuditDataLoadedRef.current) onAuditDataLoadedRef.current(data);
  }, [data]);

  const usersMap = useMemo(() => {
    const list = usersResponse?.data ?? [];
    return list.reduce((acc, u) => {
      if (u._id) acc[u._id] = u.email || u.username || u.name || u._id;
      return acc;
    }, {});
  }, [usersResponse]);
  const total = response?.total ?? 0;
  const page = response?.page ?? 1;
  const limit = response?.limit ?? DEFAULT_PAGE_SIZE;
  const totalPages = response?.totalPages ?? (Math.ceil(total / limit) || 1);

  const paginationInfo = {
    totalCount: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: 'Timestamp',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-sm text-[#0d121b] dark:text-white">{formatTimestamp(getValue())}</span>
        ),
      },
      {
        id: 'user',
        header: 'User',
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original?.user ?? row.original?.userId;
          const rawId = typeof u === 'object' ? u?._id : u;
          const email = typeof u === 'object'
            ? (u?.email || u?.username || u?.name || (rawId && usersMap[rawId]) || rawId)
            : (usersMap[rawId] || rawId);
          return <span className="text-sm font-medium">{email || '-'}</span>;
        },
      },
      {
        accessorKey: 'entityType',
        header: 'Module',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-sm text-[#0d121b] dark:text-white">{getValue() ?? '-'}</span>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-sm text-[#0d121b] dark:text-white">{getValue() ?? '-'}</span>
        ),
      },
      {
        id: 'details',
        header: 'Details',
        enableSorting: false,
        cell: ({ row }) => {
          const str = getMergedDetails(row.original);
          const truncated = str.length > DETAILS_TRUNCATE_LEN ? `${str.slice(0, DETAILS_TRUNCATE_LEN)}…` : str;
          const hasMore = str.length > DETAILS_TRUNCATE_LEN;

          return (
            <div className="max-w-md">
              <span className="text-sm text-[#4c669a] dark:text-gray-400 break-all">
                {truncated || '-'}
              </span>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => onDetails(row.original)}
                  className="ml-2 text-primary text-sm font-medium hover:underline"
                >
                  View
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [onDetails, usersMap]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: _sorting,
    onPaginationChange: _pagination,
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
    state: {
      sorting,
      pagination,
    },
  });

  const TABLE = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[800px]">
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
                  } transition-colors`}
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
        <tbody className="divide-y divide-[#e7ebf3] dark:divide-[#2a3447]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-[#4c669a]">
                No audit logs found
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-[#0d121b] dark:text-white">
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
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="px-2 py-1 rounded border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-[#0d121b] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {PAGINATION_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>{size}</option>
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
          className="px-3 py-1.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (pagination.pageIndex + 1 <= 3) pageNum = i + 1;
            else if (pagination.pageIndex + 1 >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = pagination.pageIndex - 1 + i;
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
          className="px-3 py-1.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
        <button
          onClick={() => table.setPageIndex(totalPages - 1)}
          disabled={!paginationInfo.hasNextPage}
          className="px-3 py-1.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">last_page</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] shadow-sm overflow-hidden">
      {TABLE()}
      {PAGINATION_SECTION()}
    </div>
  );
}

export default AuditLogging;
