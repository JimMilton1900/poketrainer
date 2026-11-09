import toast from 'react-hot-toast';

export const toastError = (err) =>
  toast.error(err?.body?.constraint ? `${err.message} (${err.body.constraint})` : err.message, { duration: 6000 });