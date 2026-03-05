// BASE_URL is read from .env (VITE_BASE_URL). See .env.example. Do not use import.meta.env.BASE_URL — that is Vite's app base path.
export const BASE_URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:5000/api/v1';

export const ENCODER = "Z@tca_da$hb0arD_2026";

// Pagination page size options for listing views (React Table)
export const PAGINATION_PAGE_SIZES = [20, 50, 100];

export const DEFAULT_PAGE_SIZE = 20;

// Toast Type Configurations
export const TOAST_TYPES = {
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

export const INVOICE_STATUSES = [
  {name: "DRAFT", canEdit: true, canDelete: true},
  {name: "REJECTED", canEdit: true, canDelete: true},
  {name: "PENDING_SUBMISSION", canEdit: false, canDelete: false},
  {name: "COMPLIANCE_QUEUED", canEdit: false, canDelete: false},
  {name: "COMPLIANCE_PROCESSING", canEdit: false, canDelete: false},
  {name: "COMPLIANCE_COMPLETED", canEdit: false, canDelete: false},
  {name: "SUBMITTED", canEdit: false, canDelete: false},
  {name: "CLEARANCE_QUEUED", canEdit: false, canDelete: false},
  {name: "CLEARANCE_PROCESSING", canEdit: false, canDelete: false},
  {name: "ACCEPTED", canEdit: false, canDelete: false},
  {name: "PENDING_CLEARANCE", canEdit: false, canDelete: false},
  {name: "CLEARED", canEdit: false, canDelete: false},
  {name: "FINALIZED", canEdit: false, canDelete: false},
];

