// Packages
import { Fragment } from 'react';

function PageHeader() {
  const TITLE_SECTION = () => (
    <div className="space-y-1">
      <h2 className="text-[#0d121b] dark:text-white text-3xl font-black tracking-tight">
        Zatca Overview
      </h2>
      <p className="text-[#4c669a] text-base">Real-time monitoring of ZATCA Phase 2 electronic invoicing      </p>
    </div>
  );

  const ACTIONS_SECTION = () => (
    <div className="flex gap-3">
      <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-white dark:bg-[#161f30] border border-[#e7ebf3] dark:border-[#2a3447] text-[#0d121b] dark:text-white text-sm font-bold hover:bg-gray-50 transition-colors">
        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
        <span>Oct 01 - Oct 31, 2023</span>
      </button>
      <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-md">
        <span className="material-symbols-outlined text-[18px]">add</span>
        <span>New Submission</span>
      </button>
    </div>
  );

  const PAGE_HEADER_CONTENT = () => (
    <Fragment>
      {TITLE_SECTION()}
      {ACTIONS_SECTION()}
    </Fragment>
  )

  return (
    <div className="flex flex-wrap justify-between items-end gap-4">
      {PAGE_HEADER_CONTENT()}
    </div>
  );
}

export default PageHeader;
