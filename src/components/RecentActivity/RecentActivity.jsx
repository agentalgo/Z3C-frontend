// Packages
import { Fragment } from 'react';

const submissions = [
  {
    invoice: 'INV-2023-8842',
    customer: 'Al-Futtaim Logistics',
    amount: '12,450.00',
    date: 'Oct 28, 2023 14:20',
    status: 'CLEARED',
    badgeText: 'CLEARED',    
    badgeBg: 'bg-green-100',
    badgeTextColor: 'text-green-700',
  },
  {
    invoice: 'INV-2023-8841',
    customer: 'Jeddah Retail Co.',
    amount: '3,120.50',
    date: 'Oct 28, 2023 14:15',
    status: 'REPORTED',
    badgeText: 'REPORTED',    
    badgeBg: 'bg-blue-100',
    badgeTextColor: 'text-blue-700',
  },
  {
    invoice: 'INV-2023-8840',
    customer: 'Saudi Trading Ltd',
    amount: '45,000.00',
    date: 'Oct 28, 2023 13:55',
    status: 'REJECTED',
    badgeText: 'REJECTED',    
    badgeBg: 'bg-red-100',
    badgeTextColor: 'text-red-700',
  },
  {
    invoice: 'INV-2023-8839',
    customer: 'Aramco Support Div',
    amount: '8,200.00',
    date: 'Oct 28, 2023 13:40',
    status: 'CLEARED',
    badgeText: 'CLEARED',    
    badgeBg: 'bg-green-100',
    badgeTextColor: 'text-green-700',
  },
];

function RecentActivity() {
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

  const TABLE_ROW = (submission) => (
    <tr key={submission.invoice} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-6 py-4 text-sm font-bold">{submission.invoice}</td>
      <td className="px-6 py-4 text-sm">{submission.customer}</td>
      <td className="px-6 py-4 text-sm">{submission.amount}</td>
      <td className="px-6 py-4 text-sm text-[#4c669a]">{submission.date}</td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${submission.badgeBg} ${submission.badgeTextColor}`}
        >
          {submission.badgeText}
        </span>
      </td>      
    </tr>
  );

  const TABLE_BODY = () => (
    <tbody className="divide-y divide-[#e7ebf3] dark:divide-[#2a3447]">
      {submissions.map((submission) => TABLE_ROW(submission))}
    </tbody>
  );

  const TABLE_SECTION = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        {TABLE_HEADER()}
        {TABLE_BODY()}
      </table>
    </div>
  );

  const HEADER_SECTION = () => (
    <div className="p-6 border-b border-[#e7ebf3] dark:border-[#2a3447] flex justify-between items-center">
      <h4 className="text-lg font-bold">Recent Submissions</h4>
      <button className="text-primary text-sm font-bold hover:underline">View All</button>
    </div>
  );

  const RECENT_ACTIVITY_CONTENT = () => (
    <Fragment>
      {HEADER_SECTION()}
      {TABLE_SECTION()}
    </Fragment>
  );

  return (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] shadow-sm overflow-hidden">
      {RECENT_ACTIVITY_CONTENT()}
    </div>
  );
}

export default RecentActivity;
