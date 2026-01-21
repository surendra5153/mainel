import { toast } from "react-toastify";

const defaultOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

export const notifySuccess = (message, options = {}) => {
  return toast.success(message, { ...defaultOptions, ...options });
};

export const notifyError = (message, options = {}) => {
  return toast.error(message || "Something went wrong", { 
    ...defaultOptions, 
    autoClose: 5000, // Errors stay longer
    ...options 
  });
};

export const notifyInfo = (message, options = {}) => {
  return toast.info(message, { ...defaultOptions, ...options });
};

export const notifyWarning = (message, options = {}) => {
  return toast.warning(message, { ...defaultOptions, ...options });
};

// Helper for API errors
export const notifyApiError = (error, defaultMessage = "Request failed") => {
  const message = error?.response?.data?.message || error?.message || defaultMessage;
  return notifyError(message);
};
