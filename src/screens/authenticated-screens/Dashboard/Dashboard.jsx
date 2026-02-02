// Packages
import { Fragment } from 'react';
import {
  PageHeader,
  KpiStats,
  TrendChart,
  QuickActions,
  DeviceHealth,
  RecentActivity,
  Footer,
} from '../../../components';

function Dashboard() {
  const MAIN_CONTENT = () => (
    <div className="p-8 space-y-8">
      <PageHeader />
      <KpiStats />
      <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
        <div className="xl:col-span-2">
          <TrendChart />
        </div>      
      </div>
      <RecentActivity />
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

export default Dashboard;
