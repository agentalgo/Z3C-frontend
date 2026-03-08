// Packages
import { Fragment, useState, useRef, useEffect } from 'react';

function formatDisplayDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function PageHeader({ from, to, onDateChange }) {
  const [pickerOpen, _pickerOpen] = useState(false);
  const [draftFrom, _draftFrom] = useState(from ?? '');
  const [draftTo, _draftTo] = useState(to ?? '');
  const pickerRef = useRef(null);

  // Sync drafts when parent updates date range externally
  useEffect(() => { _draftFrom(from ?? ''); }, [from]);
  useEffect(() => { _draftTo(to ?? ''); }, [to]);

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        _pickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  function handleApply() {
    if (draftFrom && draftTo && onDateChange) {
      onDateChange(draftFrom, draftTo);
    }
    _pickerOpen(false);
  }

  const dateLabel = from && to
    ? `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`
    : 'Select date range';

  const TITLE_SECTION = () => (
    <div className="space-y-1">
      <h2 className="text-[#0d121b] dark:text-white text-3xl font-black tracking-tight">
        Zatca Overview
      </h2>
      <p className="text-[#4c669a] text-base">Real-time monitoring of ZATCA Phase 2 electronic invoicing</p>
    </div>
  );

  const DATE_PICKER_DROPDOWN = () => (
    <div
      ref={pickerRef}
      className="absolute right-0 top-12 z-50 bg-white dark:bg-[#161f30] border border-[#e7ebf3] dark:border-[#2a3447] rounded-xl shadow-lg p-4 w-72"
    >
      <p className="text-xs font-bold text-[#4c669a] uppercase tracking-wider mb-3">Date Range</p>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#4c669a] mb-1">From</label>
          <input
            type="date"
            value={draftFrom}
            max={draftTo || undefined}
            onChange={(e) => _draftFrom(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#1a253a] text-[#0d121b] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4c669a] mb-1">To</label>
          <input
            type="date"
            value={draftTo}
            min={draftFrom || undefined}
            onChange={(e) => _draftTo(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#1a253a] text-[#0d121b] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => _pickerOpen(false)}
          className="flex-1 px-3 py-2 text-sm font-bold rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] text-[#4c669a] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          disabled={!draftFrom || !draftTo}
          className="flex-1 px-3 py-2 text-sm font-bold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </div>
  );

  const ACTIONS_SECTION = () => (
    <div className="flex gap-3">
      <div className="relative">
        <button
          onClick={() => _pickerOpen((v) => !v)}
          className="flex items-center gap-2 px-4 h-10 rounded-lg bg-white dark:bg-[#161f30] border border-[#e7ebf3] dark:border-[#2a3447] text-[#0d121b] dark:text-white text-sm font-bold hover:bg-gray-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          <span>{dateLabel}</span>
        </button>
        {pickerOpen && DATE_PICKER_DROPDOWN()}
      </div>
      <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-md">
        <span className="material-symbols-outlined text-[18px]">add</span>
        <span>New Submission</span>
      </button>
    </div>
  );

  return (
    <div className="flex flex-wrap justify-between items-end gap-4">
      <Fragment>
        {TITLE_SECTION()}
        {ACTIONS_SECTION()}
      </Fragment>
    </div>
  );
}

export default PageHeader;
