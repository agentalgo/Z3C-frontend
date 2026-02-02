// Packages
import toast, { toastConfig } from 'react-simple-toasts';
import 'react-simple-toasts/dist/style.css';
import 'react-simple-toasts/dist/theme/dark.css';

// Constants
import { toastTypes } from './constants';

// Toast Configuration
toastConfig({
  position: 'top-right',
  duration: 3000,
  clickClosable: true,
  maxVisibleToasts: 3,
  className: 'toast-custom',
});

// Toast Helper Function
export const showToast = (message, type = 'info', options = {}) => {
  const config = toastTypes[type] || toastTypes.info;
  
  return toast(message, {
    ...options,
    render: (msg) => (
      <div className={`flex items-center gap-3 px-4 py-3 ${config.bgColor} border ${config.borderColor} rounded-lg shadow-lg text-sm text-[#0d121b] dark:text-white`}>
        <span className={`material-symbols-outlined text-[20px] ${config.iconColor}`}>
          {config.icon}
        </span>
        <span>{msg}</span>
      </div>
    ),
  });
};
