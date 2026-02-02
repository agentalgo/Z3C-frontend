// Packages
import { Fragment } from 'react';

const actions = [
  {
    label: 'Upload XML',
    helper: 'Batch submission support',
    icon: 'upload',
  },
  {
    label: 'Renew CSID',
    helper: 'Expires in 45 days',
    icon: 'key',
  },
  {
    label: 'Export Logs',
    helper: 'Download monthly report',
    icon: 'download',
  },
]

function QuickActions() {
  const ACTION_BUTTON = (action) => (
    <button
      key={action.label}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] hover:bg-gray-50 dark:hover:bg-[#1a253a] transition-colors text-left"
    >
      <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">
        {action.icon}
      </span>
      <div className="text-left">
        <p className="text-sm font-bold">{action.label}</p>
        <p className="text-[11px] text-[#4c669a]">{action.helper}</p>
      </div>
    </button>
  );

  const ACTIONS_LIST = () => (
    <div className="space-y-3">
      {actions.map((action) => ACTION_BUTTON(action))}
    </div>
  )

  const QUICK_ACTIONS_CONTENT = () => (
    <Fragment>
      <h4 className="text-sm font-bold uppercase tracking-wider text-[#4c669a] mb-6">Quick Actions</h4>
      {ACTIONS_LIST()}
    </Fragment>
  );

  return (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] p-6 shadow-sm">
      {QUICK_ACTIONS_CONTENT()}
    </div>
  );
}

export default QuickActions;
