// Packages
import { Fragment } from 'react';
import { Chart } from 'react-google-charts';

/**
 * Transforms the API trends array into Google Charts ColumnChart format.
 * Accepts either an array or wrapped response { data: { data: [...] } }.
 * Expects items shaped as: { date, cleared, reported }
 */
function buildChartData(trends) {
  const list = Array.isArray(trends) ? trends : (trends?.data?.data ?? trends?.data ?? []);
  if (!Array.isArray(list) || list.length === 0) return null;

  const hasReported = list.some((t) => t.reported != null);
  const header = hasReported ? ['Date', 'Cleared', 'Reported'] : ['Date', 'Cleared'];

  const rows = list.map((t) => {
    const raw = t.date ?? t.submittedAt ?? t.day ?? '';
    let label = raw;
    try {
      const d = new Date(raw);
      if (!isNaN(d)) {
        const day = d.getDate();
        const month = d.toLocaleString('default', { month: 'short' });
        label = `${day} ${month}`;
      }
    } catch (_) { /* keep raw */ }

    const cleared = Number(t.cleared ?? t.clearedCount ?? 0);
    if (hasReported) {
      return [label, cleared, Number(t.reported ?? t.reportedCount ?? 0)];
    }
    return [label, cleared];
  });

  return [header, ...rows];
}

const options = {
  title: '',
  chartArea: {
    width: '75%',
    height: '70%',
    left: 60,
    top: 20,
    right: 20,
    bottom: 50,
  },
  hAxis: {
    title: '',
    textStyle: { color: '#4c669a', fontSize: 10, fontName: 'Inter' },
    gridlines: { color: 'transparent' },
  },
  vAxis: {
    title: '',
    textStyle: { color: '#4c669a', fontSize: 10, fontName: 'Inter' },
    gridlines: { color: '#e7ebf3' },
  },
  legend: { position: 'none' },
  colors: ['#607AFB', '#93C5FD'],
  backgroundColor: 'transparent',
  isStacked: false,
  bar: { groupWidth: '75%' },
};

function TrendChart({ trends, loading }) {
  const chartData = buildChartData(trends);
  const hasReported = chartData && chartData[0]?.length === 3;

  const HEADER_SECTION = () => (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h4 className="text-lg font-bold">Submission Trends</h4>
        <p className="text-sm text-[#4c669a]">Daily submission volume</p>
      </div>
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs font-medium">Cleared</span>
        </div>
        {hasReported && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-3 h-3 rounded-full bg-blue-200" />
            <span className="text-xs font-medium">Reported</span>
          </div>
        )}
      </div>
    </div>
  );

  const CHART_SECTION = () => {
    if (loading) {
      return (
        <div className="h-[300px] w-full flex items-center justify-center animate-pulse">
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      );
    }

    if (!chartData) {
      return (
        <div className="h-[300px] w-full flex items-center justify-center text-[#4c669a] text-sm">
          No trend data available
        </div>
      );
    }

    return (
      <div className="h-[300px] w-full">
        <Chart
          chartType="ColumnChart"
          width="100%"
          height="300px"
          data={chartData}
          options={options}
        />
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] p-6 shadow-sm overflow-hidden">
      <Fragment>
        {HEADER_SECTION()}
        {CHART_SECTION()}
      </Fragment>
    </div>
  );
}

export default TrendChart;
