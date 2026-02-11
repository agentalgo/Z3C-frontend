// Packages
import { Fragment, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { ErrorBoundary } from 'react-error-boundary';
import { Footer, ErrorFallback } from '../../../components';
import { fetchPaginatedData } from '../../../requests';
import { DEFAULT_PAGE_SIZE, PAGINATION_PAGE_SIZES } from '../../../utils';

// Sample data fallback (for initial render)
const sampleCompanyProfiles = [
  {
    profileName: 'Main Branch',
    profileNumber: 'PRF-001',
    companyName: 'Al-Futtaim Trading LLC',
    email: 'info@alfuttaim.sa',
    phoneNumber: '+966 11 234 5678',
    crnNumber: '1010123456',
    vat: '300012345600003',
    fullAddress: 'King Fahd Road, Al Olaya District, Riyadh 12345, Saudi Arabia',
  },
  {
    profileName: 'Jeddah Office',
    profileNumber: 'PRF-002',
    companyName: 'Saudi Logistics Co.',
    email: 'contact@saudilogistics.sa',
    phoneNumber: '+966 12 345 6789',
    crnNumber: '4030567890',
    vat: '300098765400003',
    fullAddress: 'Prince Sultan Street, Al Rawdah, Jeddah 21432, Saudi Arabia',
  },
  {
    profileName: 'Eastern Region',
    profileNumber: 'PRF-003',
    companyName: 'Gulf Industries Ltd',
    email: 'support@gulfindustries.sa',
    phoneNumber: '+966 13 456 7890',
    crnNumber: '2050234567',
    vat: '300045678900003',
    fullAddress: 'King Abdullah Road, Al Khobar 31952, Saudi Arabia',
  },
  {
    profileName: 'Warehouse Division',
    profileNumber: 'PRF-004',
    companyName: 'National Storage Solutions',
    email: 'warehouse@nss.sa',
    phoneNumber: '+966 11 567 8901',
    crnNumber: '1010789012',
    vat: '300078901200003',
    fullAddress: 'Industrial Area, Second Industrial City, Riyadh 14334, Saudi Arabia',
  },
  {
    profileName: 'Export Unit',
    profileNumber: 'PRF-005',
    companyName: 'Arabian Exports Inc.',
    email: 'exports@arabianexports.sa',
    phoneNumber: '+966 12 678 9012',
    crnNumber: '4030345678',
    vat: '300034567800003',
    fullAddress: 'Jeddah Islamic Port, Jeddah 21188, Saudi Arabia',
  },
];

function CompanyProfileList() {
  const navigate = useNavigate();
  const [data, _data] = useState([]);
  const [isLoading, _isLoading] = useState(false);
  const [pagination, _pagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [sorting, _sorting] = useState([]);
  const [rowSelection, _rowSelection] = useState({});
  const [searchQuery, _searchQuery] = useState('');
  const [appliedSearchQuery, _appliedSearchQuery] = useState('');
  const [isFilterOpen, _isFilterOpen] = useState(false);
  const [isActionsOpen, _isActionsOpen] = useState(false);
  const [paginationInfo, _paginationInfo] = useState({
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Fetch data when pagination changes
  useEffect(() => {
    const loadData = async () => {
      _isLoading(true);
      try {
        const response = await fetchPaginatedData(
          '/api/company-profiles',
          pagination.pageIndex + 1,
          pagination.pageSize,
          { search: appliedSearchQuery || undefined }
        );
        _data(response.data);
        _paginationInfo(response.pagination);
      } catch (error) {
        console.error('Error fetching company profiles:', error);
      } finally {
        _isLoading(false);
      }
    };

    loadData();
  }, [pagination.pageIndex, pagination.pageSize, appliedSearchQuery]);

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
        accessorKey: 'profileName',
        header: 'Profile Name',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'profileNumber',
        header: 'Profile Number',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'companyName',
        header: 'Company Name',
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
        accessorKey: 'phoneNumber',
        header: 'Phone Number',
        enableSorting: true,
      },
      {
        accessorKey: 'crnNumber',
        header: 'CRN Number',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'vat',
        header: 'VAT',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'fullAddress',
        header: 'Full Address',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-xs max-w-[200px] truncate block" title={getValue()}>{getValue()}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/company-profile/${row.original.id || row.original.profileNumber}`)}
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
    data: data.length > 0 ? data : sampleCompanyProfiles,
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

  const HEADER_SECTION = () => (
    <div className="flex flex-wrap justify-between items-end gap-4">
      <div className="space-y-1">
        <h2 className="text-[#0d121b] dark:text-white text-3xl font-black tracking-tight">
          Company Profile
        </h2>
        <p className="text-[#4c669a] text-base">Manage your company profiles and ZATCA registrations</p>
      </div>
    </div>
  );

  const TOOLBAR_SECTION = () => (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c669a] text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search company profiles..."
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

      {/* Right Side Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Actions Dropdown - Only visible when rows are selected */}
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

            {/* Actions Dropdown Menu */}
            {isActionsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#161f30] rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] shadow-lg z-20">
                <div className="py-1">
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Edit Selected
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Export Selected
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    Duplicate
                  </button>
                  <div className="border-t border-[#e7ebf3] dark:border-[#2a3447] my-1"></div>
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Delete Selected
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters Dropdown */}
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

          {/* Dropdown Menu */}
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#161f30] rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] shadow-lg z-20">
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    placeholder="Filter by company..."
                    className="mt-1 w-full rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#0f1323] text-sm text-[#0d121b] dark:text-white py-2 px-3"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-wider">Region</label>
                  <select className="mt-1 w-full rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#0f1323] text-sm text-[#0d121b] dark:text-white py-2 px-3">
                    <option value="">All Regions</option>
                    <option value="riyadh">Riyadh</option>
                    <option value="jeddah">Jeddah</option>
                    <option value="eastern">Eastern Region</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2 border-t border-[#e7ebf3] dark:border-[#2a3447]">
                  <button className="flex-1 px-3 py-2 text-sm font-medium text-[#4c669a] hover:text-[#0d121b] dark:hover:text-white transition-colors">
                    Reset
                  </button>
                  <button className="flex-1 px-3 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Button */}
        <button
          onClick={() => navigate('/company-profile/new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 w-full sm:w-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create
        </button>
      </div>
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
          disabled={!paginationInfo.hasPreviousPage || isLoading}
          className="px-3 py-1.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">first_page</span>
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!paginationInfo.hasPreviousPage || isLoading}
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
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pagination.pageIndex + 1 === pageNum
                  ? 'bg-primary text-white'
                  : 'border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => table.nextPage()}
          disabled={!paginationInfo.hasNextPage || isLoading}
          className="px-3 py-1.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
        <button
          onClick={() => table.setPageIndex(paginationInfo.totalPages - 1)}
          disabled={!paginationInfo.hasNextPage || isLoading}
          className="px-3 py-1.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] text-sm text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">last_page</span>
        </button>
      </div>
    </div>
  );

  const TABLE_SECTION = () => (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1200px]">
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
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-[#4c669a]">
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-[#4c669a]">
                  No company profiles found
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
      {PAGINATION_SECTION()}
    </div>
  );

  const MAIN_CONTENT = () => (
    <div className="p-8 space-y-6">
      {HEADER_SECTION()}
      {TOOLBAR_SECTION()}
      {TABLE_SECTION()}
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

export default CompanyProfileList;
