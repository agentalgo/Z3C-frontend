const stats = [
  { title: 'Total Invoices', value: '12,840', delta: '+12.5%', color: '#07883b', icon: 'receipt_long', bar: 'w-[85%]' },
  { title: 'Cleared', value: '11,200', delta: '+10.2%', color: '#07883b', icon: 'task_alt', bar: 'w-[87%]', contrast: 'bg-green-500' }, 
  { title: 'Rejection Rate', value: '1.48%', delta: '-0.2%', color: '#e73908', icon: 'warning', bar: 'w-[1.5%]', contrast: 'bg-red-500' },
];

function KpiStats() {
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
        <span className="text-sm font-bold" style={{ color: stat.color }}>
          {stat.delta}
        </span>
      </div>
      <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${stat.contrast ?? 'bg-primary'} ${stat.bar}`}></div>
      </div>
    </article>
  );

  const STATS_GRID = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat) => STAT_CARD(stat))}
    </div>
  )

  return (
    <div>
      {STATS_GRID()}
    </div>
  );
}

export default KpiStats;
