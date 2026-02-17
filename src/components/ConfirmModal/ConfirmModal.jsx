import { Fragment } from 'react';

function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isConfirming = false,
}) {
  if (!isOpen) return null;

  const handleCancel = () => {
    if (isConfirming) return;
    onCancel?.();
  };

  const handleConfirm = () => {
    if (isConfirming) return;
    onConfirm?.();
  };

  return (
    <Fragment>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={handleCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161f30] shadow-2xl border border-[#e7ebf3] dark:border-[#2a3447]">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">
                  {title}
                </h3>
                {description && (
                  <p className="mt-2 text-sm text-[#4c669a] dark:text-gray-400">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="px-6 pb-5 pt-3 flex flex-col sm:flex-row justify-end gap-3 border-t border-[#e7ebf3] dark:border-[#2a3447] bg-[#f8f9fc] dark:bg-[#1a253a] rounded-b-2xl">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex justify-center rounded-lg border border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161f30] px-4 py-2.5 text-sm font-medium text-[#0d121b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              disabled={isConfirming}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex justify-center rounded-lg bg-red-600 text-white px-4 py-2.5 text-sm font-semibold shadow-md shadow-red-500/30 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              disabled={isConfirming}
            >
              {isConfirming ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default ConfirmModal;

