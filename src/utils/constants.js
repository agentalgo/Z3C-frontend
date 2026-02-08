// export const BASE_URL = 'https://api.zatca.com/api/v1';
export const BASE_URL = 'http://localhost:5000/api/v1';

export const ENCODER = "Z@tca_da$hb0arD_2026";

// Pagination page size options for listing views (React Table)
export const PAGINATION_PAGE_SIZES = [20, 50, 100];

// Toast Type Configurations
export const toastTypes = {
  success: {
    icon: 'check_circle',
    iconColor: 'text-green-500',
    borderColor: 'border-green-200 dark:border-green-800',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  error: {
    icon: 'error',
    iconColor: 'text-red-500',
    borderColor: 'border-red-200 dark:border-red-800',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  info: {
    icon: 'info',
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-200 dark:border-blue-800',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
};
