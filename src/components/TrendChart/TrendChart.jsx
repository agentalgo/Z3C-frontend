// Packages
import { Fragment } from 'react';
import { Chart } from 'react-google-charts';

// Generate sample data for last 30 days (Oct 1-30, 2023)
const generateChartData = () => {
  const data = [['Date', 'Cleared']]
  
  // Sample data matching the original mock chart pattern
  const clearedValues = [380, 420, 395, 450, 410, 385, 435, 380, 420, 320, 410, 480]
  
  // Generate dates for Oct 1-30
  for (let i = 0; i < 30; i++) {
    const date = new Date(2023, 9, i + 1) // Month is 0-indexed, so 9 = October
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const dateLabel = `${day} ${month}`;
    
    // Use modulo to cycle through sample values
    const cleared = clearedValues[i % clearedValues.length];
    
    data.push([dateLabel, cleared]);
  }
  
  return data;
};

function TrendChart() {
  const chartData = generateChartData();

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
      textStyle: {
        color: '#4c669a',
        fontSize: 10,
        fontName: 'Inter',
      },
      gridlines: {
        color: 'transparent',
      },
    },
    vAxis: {
      title: '',
      textStyle: {
        color: '#4c669a',
        fontSize: 10,
        fontName: 'Inter',
      },
      gridlines: {
        color: '#e7ebf3',
      },
    },
    legend: {
      position: 'none',
    },
    colors: ['#607AFB', '#93C5FD'], // Primary color for Cleared, light blue for Reported
    backgroundColor: 'transparent',
    isStacked: false,
    bar: {
      groupWidth: '75%',
    },
  }

  const HEADER_SECTION = () => (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h4 className="text-lg font-bold">Submission Trends</h4>
        <p className="text-sm text-[#4c669a]">Last 30 days daily volume</p>
      </div>
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary"></span>
          <span className="text-xs font-medium">Cleared</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="w-3 h-3 rounded-full bg-blue-200"></span>
          <span className="text-xs font-medium">Reported</span>
        </div>
      </div>
    </div>
  );

  const CHART_SECTION = () => (
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

  const CHART_CONTENT = () => (
    <Fragment>
      {HEADER_SECTION()}
      {CHART_SECTION()}
    </Fragment>
  );

  return (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] p-6 shadow-sm overflow-hidden">
      {CHART_CONTENT()}
    </div>
  );
}

export default TrendChart;
