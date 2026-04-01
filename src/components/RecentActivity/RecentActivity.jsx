// Packages
import { Fragment } from 'react';

const STATUS_BADGE = {
  CLEARED:  { bg: 'bg-green-100', text: 'text-green-700' },
  REPORTED: { bg: 'bg-blue-100',  text: 'text-blue-700'  },
  REJECTED: { bg: 'bg-red-100',   text: 'text-red-700'   },
  PENDING:  { bg: 'bg-yellow-100',text: 'text-yellow-700'},
};

function getBadge(status) {
  const key = String(status ?? '').toUpperCase();
  return STATUS_BADGE[key] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
}

function formatAmount(value) {
  if (value == null) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d)) return String(value);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(',', '');
  } catch {
    return String(value);
  }
}

function normalizeSubmission(s) {
  return {
    invoice: s.invoiceNumber ?? s.invoice_number ?? s.invoiceNo ?? s.invoice ?? '—',
    customer: s.customerName ?? s.customer_name ?? s.customer ?? '—',
    amount: formatAmount(s.amountSAR ?? s.totalAmount ?? s.total_amount ?? s.amount),
    date: formatDate(s.submissionDate ?? s.submittedAt ?? s.submitted_at ?? s.date ?? s.createdAt),
    status: String(s.status ?? '').toUpperCase(),
  };
}

const SKELETON_ROW = () => (
  <tr className="animate-pulse">
    {[0, 1, 2, 3, 4].map((i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </td>
    ))}
  </tr>
);

function RecentActivity({ submissions, loading, showViewAll = false, onViewAll }) {
  const list = Array.isArray(submissions) ? submissions : (submissions?.data?.data ?? submissions?.data ?? []);
  const rows = Array.isArray(list) ? list.map(normalizeSubmission) : [];

  const TABLE_HEADER = () => (
    <thead className="bg-[#f8f9fc] dark:bg-[#1a253a] text-[#4c669a] text-xs font-bold uppercase tracking-wider">
      <tr>
        <th className="px-6 py-4">Invoice #</th>
        <th className="px-6 py-4">Customer</th>
        <th className="px-6 py-4">Amount (SAR)</th>
        <th className="px-6 py-4">Submission Date</th>
        <th className="px-6 py-4">Status</th>
      </tr>
    </thead>
  );

  const TABLE_ROW = (row) => {
    const badge = getBadge(row.status);
    return (
      <tr key={`${row.invoice}-${row.date}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <td className="px-6 py-4 text-sm font-bold">{row.invoice}</td>
        <td className="px-6 py-4 text-sm">{row.customer}</td>
        <td className="px-6 py-4 text-sm">{row.amount}</td>
        <td className="px-6 py-4 text-sm text-[#4c669a]">{row.date}</td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
            {row.status || '—'}
          </span>
        </td>
      </tr>
    );
  };

  const TABLE_BODY = () => (
    <tbody className="divide-y divide-[#e7ebf3] dark:divide-[#2a3447]">
      {loading
        ? [0, 1, 2, 3, 4].map((i) => <SKELETON_ROW key={i} />)
        : rows.length > 0
          ? rows.map((row) => TABLE_ROW(row))
          : (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-sm text-[#4c669a]">
                No recent submissions
              </td>
            </tr>
          )
      }
    </tbody>
  );

  const HEADER_SECTION = () => (
    <div className="p-6 border-b border-[#e7ebf3] dark:border-[#2a3447] flex justify-between items-center">
      <h4 className="text-lg font-bold">Recent Submissions</h4>
      {showViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="text-primary text-sm font-bold hover:underline"
        >
          View All
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] shadow-sm overflow-hidden">
      <Fragment>
        {HEADER_SECTION()}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            {TABLE_HEADER()}
            {TABLE_BODY()}
          </table>
        </div>
      </Fragment>
    </div>
  );
}

export default RecentActivity;
