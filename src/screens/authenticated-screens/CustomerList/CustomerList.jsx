// Packages
import { Fragment, useMemo, useState, Suspense, use } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { useAtomValue } from 'jotai';

// APIs
import { CustomerListRequest } from '../../../requests';

// Utils
import { Footer } from '../../../components';
import { auth } from '../../../atoms';
import { PAGINATION_PAGE_SIZES, decodeString } from '../../../utils';

function CustomerList() {
  const navigate = useNavigate();
  const authValue = useAtomValue(auth);

  const [pagination, _pagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, _sorting] = useState([]);
  const [searchQuery, _searchQuery] = useState('');
  const [appliedSearchQuery, _appliedSearchQuery] = useState('');
  const [isFilterOpen, _isFilterOpen] = useState(false);
  const [isActionsOpen, _isActionsOpen] = useState(false);


  const customersPromise = useMemo(() => {
    const decodedToken = decodeString(authValue);
    const params = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: appliedSearchQuery || undefined,
      sortBy: sorting.length > 0 ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}` : undefined,
    };

    return CustomerListRequest(decodedToken, params);
  }, [authValue, pagination.pageIndex, pagination.pageSize, appliedSearchQuery, sorting]);

  const TableLoadingSkeleton = () => (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] shadow-sm overflow-hidden">
      <div className="px-6 py-8 text-center text-sm text-[#4c669a]">
        <div className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin">sync</span>
          Loading Customers...
        </div>
      </div>
    </div>
  );

  const [rowSelection, _rowSelection] = useState({});

  return (
    <Fragment>
      <div className="p-8 space-y-6">
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div className="space-y-1">
            <h2 className="text-[#0d121b] dark:text-white text-3xl font-black tracking-tight">
              Customers
            </h2>
            <p className="text-[#4c669a] text-base">Manage your customer information and records</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c669a] text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search customers..."
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

            <button
              onClick={() => navigate('/customer/new')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Create Customer
            </button>
          </div>
        </div>

        <Suspense fallback={<TableLoadingSkeleton />}>
          <CustomersTableContent
            customersPromise={customersPromise}
            pagination={pagination}
            _pagination={_pagination}
            sorting={sorting}
            _sorting={_sorting}
            rowSelection={rowSelection}
            _rowSelection={_rowSelection}
          />
        </Suspense>
      </div>
      <Footer />
    </Fragment>
  );
}

function CustomersTableContent({
  customersPromise,
  pagination,
  _pagination,
  sorting,
  _sorting,
  rowSelection,
  _rowSelection,
}) {
  const navigate = useNavigate();
  const response = use(customersPromise);
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
        accessorKey: 'registrationName',
        header: 'Registered Name',
        enableSorting: true,
      },
      {
        accessorKey: 'companyProfile',
        header: 'Company Profile',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'streetName',
        header: 'Street',
        enableSorting: true,
      },
      {
        accessorKey: 'buildingNumber',
        header: 'Building',
        enableSorting: true,
      },
      {
        accessorKey: 'citySubdivisionName',
        header: 'District',
        enableSorting: true,
      },
      {
        accessorKey: 'cityName',
        header: 'City',
        enableSorting: true,
      },
      {
        accessorKey: 'postalZone',
        header: 'Postal Zone',
        enableSorting: true,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        enableSorting: true,
        cell: ({ getValue }) => (
          <a href={`mailto:${getValue()}`} className="text-primary hover:underline">{getValue()}</a>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        enableSorting: true,
      },
      {
        accessorKey: 'customerVAT',
        header: 'Customer VAT',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue()}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/customer/${row.original._id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#161f30] border border-[#e7ebf3] dark:border-[#2a3447] text-xs font-semibold text-[#4c669a] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit
          </button>
        ),
        enableSorting: false,
      },
    ],
    [navigate]
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

  const selectedRowCount = Object.keys(rowSelection).length;

  return (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] shadow-sm overflow-hidden">
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
                  No customers found
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
    </div>
  );
}

export default CustomerList;
