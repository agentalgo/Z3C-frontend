function formatDelta(value) {
  if (value == null) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return String(value);
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num}%`;
}

function buildStats(apiData) {
  // API shape: totalInvoices, clearedInvoices, rejectionRate each = { current, previous, deltaPercent }
  apiData = apiData?.data ?? apiData;
  const total = apiData?.totalInvoices?.current ?? apiData?.total_invoices?.current ?? null;
  const totalDelta = apiData?.totalInvoices?.deltaPercent ?? apiData?.total_invoices?.deltaPercent ?? null;
  const cleared = apiData?.clearedInvoices?.current ?? apiData?.cleared_invoices?.current ?? null;
  const clearedDelta = apiData?.clearedInvoices?.deltaPercent ?? apiData?.cleared_invoices?.deltaPercent ?? null;
  const rejectionRate = apiData?.rejectionRate?.current ?? apiData?.rejection_rate?.current ?? null;
  const rejectionRateDelta = apiData?.rejectionRate?.deltaPercent ?? apiData?.rejection_rate?.deltaPercent ?? null;

  const fmtDeltaColor = (val) => {
    if (val == null) return '#4c669a';
    return parseFloat(val) >= 0 ? '#07883b' : '#e73908';
  };

  return [
    {
      title: 'Total Invoices',
      value: total != null ? Number(total).toLocaleString() : '—',
      delta: formatDelta(totalDelta),
      deltaColor: fmtDeltaColor(totalDelta),
      icon: 'receipt_long',
      bar: total != null ? `w-[${Math.min(100, Math.round((total / 20000) * 100))}%]` : 'w-[0%]',
    },
    {
      title: 'Cleared',
      value: cleared != null ? Number(cleared).toLocaleString() : '—',
      delta: formatDelta(clearedDelta),
      deltaColor: fmtDeltaColor(clearedDelta),
      icon: 'task_alt',
      bar: cleared != null && total != null
        ? `w-[${Math.min(100, Math.round((cleared / Math.max(total, 1)) * 100))}%]`
        : 'w-[0%]',
      contrast: 'bg-green-500',
    },
    {
      title: 'Rejection Rate',
      value: rejectionRate != null ? `${parseFloat(rejectionRate).toFixed(2)}%` : '—',
      delta: formatDelta(rejectionRateDelta),
      deltaColor: fmtDeltaColor(
        rejectionRateDelta != null ? -parseFloat(rejectionRateDelta) : null
      ),
      icon: 'warning',
      bar: rejectionRate != null ? `w-[${Math.min(100, Math.ceil(parseFloat(rejectionRate)))}%]` : 'w-[0%]',
      contrast: 'bg-red-500',
    },
  ];
}

const SKELETON_CARD = () => (
  <article className="bg-white dark:bg-[#161f30] rounded-xl p-6 border border-[#e7ebf3] dark:border-[#2a3447] shadow-sm animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
    <div className="flex items-baseline gap-2">
      <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
    <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-800 rounded-full" />
  </article>
);

function KpiStats({ stats: apiData, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => <SKELETON_CARD key={i} />)}
      </div>
    );
  }

  const stats = buildStats(apiData);

  const STAT_CARD = (stat) => (
    <article
      key={stat.title}
      className="bg-white dark:bg-[#161f30] rounded-xl p-6 border border-[#e7ebf3] dark:border-[#2a3447] shadow-sm"
    >
      <div className="flex justify-between items-start mb-4">
        <p className="text-[#4c669a] text-sm font-medium">{stat.title}</p>
        <span className="material-symbols-outlined text-primary">{stat.icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-[#0d121b] dark:text-white text-2xl font-black">{stat.value}</h3>
        {stat.delta && (
          <span className="text-sm font-bold" style={{ color: stat.deltaColor }}>
            {stat.delta}
          </span>
        )}
      </div>
      <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${stat.contrast ?? 'bg-primary'} ${stat.bar}`} />
      </div>
    </article>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat) => STAT_CARD(stat))}
    </div>
  );
}

export default KpiStats;
