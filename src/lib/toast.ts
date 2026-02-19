import { toast as sonnerToast } from "sonner";

/**
 * Unified toast utility using Sonner
 * Use this instead of importing toast directly from sonner
 */
export const toast = {
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, { description });
  },

  error: (message: string, description?: string) => {
    return sonnerToast.error(message, { description });
  },

  info: (message: string, description?: string) => {
    return sonnerToast.info(message, { description });
  },

  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, { description });
  },

  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, { description });
  },

  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, options);
  },

  custom: (component: (id: string | number) => React.ReactElement) => {
    return sonnerToast.custom(component);
  },

  dismiss: (id?: string | number) => {
    return sonnerToast.dismiss(id);
  },
};
