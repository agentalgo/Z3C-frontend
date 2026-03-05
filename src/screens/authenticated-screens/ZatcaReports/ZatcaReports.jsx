// Packages
import { Fragment, useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
// APIs
import { ZatcaReportDownloadRequest } from '../../../requests';

//Utils
import { auth } from '../../../atoms';
import { Footer } from '../../../components';
import { showToast, decodeString } from '../../../utils';

function ZatcaReports() {
  const authValue = useAtomValue(auth);
  const decodedToken = useMemo(() => decodeString(authValue), [authValue]);
  const [filters, _filters] = useState({
    fromDate: '',
    toDate: '',
    zatcaStatus: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // *********** Handlers ***********
  const handleDownloadReport = async () => {
    // Require at least one filter before calling the API
    if (!filters.fromDate && !filters.toDate && !filters.zatcaStatus) {
      showToast('Please apply at least one filter before downloading the report', 'error');
      return;
    }

    if (isLoading) {
      showToast('Please wait for the previous download to complete', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const excelBlob = await ZatcaReportDownloadRequest(decodedToken, filters);
      // Ensure correct MIME type and force download with .xlsx filename
      const typedBlob =
        excelBlob && excelBlob.type
          ? excelBlob
          : new Blob([excelBlob], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

      const fileURL = window.URL.createObjectURL(typedBlob);
      const link = document.createElement('a');

      const from = filters.fromDate || 'ALL';
      const to = filters.toDate || 'ALL';
      const status = filters.zatcaStatus || 'ALL';
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

      link.href = fileURL;
      link.download = `zatca-invoice-report_${from}_to_${to}_${status}_${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Excel report download started', 'success');

      setTimeout(() => {
        window.URL.revokeObjectURL(fileURL);
      }, 10000);
    } catch (error) {
      showToast(error?.message || 'Failed to download ZATCA report', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // *********** Render Functions ***********
  const PAGE_HEADER = () => (
    <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[#0d121b] dark:text-white text-3xl font-black leading-tight">
          ZATCA Invoice Reporting
        </h1>
        <p className="text-[#4c669a] dark:text-gray-400 text-base font-normal">
          Export invoice reports by date range and ZATCA status.
        </p>
      </div>
    </div>
  );

  const FILTERS_CARD = () => (
    <section className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447]">
      <div className="p-6 space-y-6">
        <h3 className="text-[#0d121b] dark:text-white text-base font-bold flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary"></span>
          Export Filters
        </h3>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">
              From Date
            </label>
            <input
              type="date"
              className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
              value={filters.fromDate}
              onChange={(e) =>
                _filters((prev) => ({
                  ...prev,
                  fromDate: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">
              To Date
            </label>
            <input
              type="date"
              className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
              value={filters.toDate}
              onChange={(e) =>
                _filters((prev) => ({
                  ...prev,
                  toDate: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-bold text-[#4c669a] dark:text-gray-400">
              ZATCA Status
            </label>
            <select
              className="px-4 py-2.5 rounded-lg border border-[#e7ebf3] bg-white pr-8 text-sm text-[#0d121b] focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none dark:bg-[#161f30] dark:border-[#2a3447] dark:text-white"
              value={filters.zatcaStatus || ''}
              onChange={(e) =>
                _filters((prev) => ({
                  ...prev,
                  zatcaStatus: e.target.value,
                }))
              }
            >
              <option value="" disabled>
                ZATCA Status
              </option>
              <option value="ALL">All (Cleared or Reported)</option>
              <option value="CLEARED">Cleared</option>
              <option value="REPORTED">Reported</option>
              <option value="NOT_REPORTED">Not Reported</option>
            </select>
          </div>

          <div className="w-full lg:w-auto flex lg:inline-flex justify-stretch lg:justify-end">
            <button
              type="button"
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-sm hover:bg-[#041632] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0b2551]"
              disabled={isLoading}
              onClick={handleDownloadReport}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {isLoading ? 'DOWNLOADING...' : 'DOWNLOAD'}
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-dashed border-[#e7ebf3] dark:border-[#2a3447] text-xs text-[#4c669a] dark:text-gray-400 space-y-2">
          <p>
            <span className="font-bold text-[#0d121b] dark:text-white">Note:</span>{' '}
            This report will export invoices based on the selected filters. The exported
            file will be organized by month with separate sheets for each month.
          </p>
          <div className="space-y-1">
            <p className="font-bold text-[#0d121b] dark:text-white">Status Options:</p>
            <p>
              <span className="font-semibold">All (Cleared or Reported):</span> Invoices
              that are either cleared or reported to ZATCA
            </p>
            <p>
              <span className="font-semibold">Cleared:</span> Only invoices with ZATCA
              clearance status
            </p>
            <p>
              <span className="font-semibold">Reported:</span> Only invoices that have
              been reported to ZATCA
            </p>
            <p>
              <span className="font-semibold">Not Reported:</span> Invoices that have not
              been cleared or reported (no ZATCA response)
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  const MAIN_CONTENT = () => (
    <div className="p-8 space-y-8">
      {PAGE_HEADER()}
      {FILTERS_CARD()}
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

export default ZatcaReports;

