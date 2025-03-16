import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Default toast styling
const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  style: {
    background: "rgba(30, 30, 30, 0.9)",
    backdropFilter: "blur(12px)",
    color: "#ffffff",
    borderLeft: "4px solid #10b981",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    fontWeight: 500,
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    maxWidth: "400px", // Prevents content from being too wide
    wordWrap: "break-word", // Ensures long text wraps properly
    whiteSpace: "normal", // Prevents text from cutting off
  },
};

// Success toast with green accent
export const showSuccess = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    ...defaultOptions,
    ...options,
    style: {
      ...defaultOptions.style,
      borderLeft: "4px solid #10b981",
      ...(options?.style || {}),
    },
    progressStyle: {
      background: "linear-gradient(to right, #10b981, #34d399)",
    },
  });
};

// Error toast with red accent
export const showError = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    ...defaultOptions,
    ...options,
    style: {
      ...defaultOptions.style,
      borderLeft: "5px solid #ef4444",
      boxShadow: "0 6px 20px rgba(255, 50, 50, 0.4)",
      fontWeight: 600,
      borderRadius: "12px",
      ...(options?.style || {}),
    },
    progressStyle: {
      background: "linear-gradient(to right, #ef4444, #f87171)",
    },
  });
};

// Warning toast with yellow accent
export const showWarning = (message: string, options?: ToastOptions) => {
  return toast.warning(message, {
    ...defaultOptions,
    ...options,
    style: {
      ...defaultOptions.style,
      borderLeft: "5px solid #f59e0b",
      ...(options?.style || {}),
    },
    progressStyle: {
      background: "linear-gradient(to right, #f59e0b, #fbbf24)",
    },
  });
};

// Info toast with blue accent
export const showInfo = (message: string, options?: ToastOptions) => {
  return toast.info(message, {
    ...defaultOptions,
    ...options,
    style: {
      ...defaultOptions.style,
      borderLeft: "4px solid #3b82f6",
      ...(options?.style || {}),
    },
    progressStyle: {
      background: "linear-gradient(to right, #3b82f6, #60a5fa)",
    },
  });
};