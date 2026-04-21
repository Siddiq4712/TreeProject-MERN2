import Swal from 'sweetalert2';

const brandButtons = {
  confirmButtonColor: '#2d6a4f',
  cancelButtonColor: '#dc2626',
};

export const showSuccess = (title, text = '') =>
  Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 2200,
    showConfirmButton: false,
  });

export const showError = (title, text = '') =>
  Swal.fire({
    icon: 'error',
    title,
    text,
    ...brandButtons,
  });

export const showInfo = (title, text = '') =>
  Swal.fire({
    icon: 'info',
    title,
    text,
    ...brandButtons,
  });

export const confirmAction = (title, text, confirmButtonText = 'Confirm') =>
  Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    ...brandButtons,
  });

export const promptText = (title, inputLabel, inputPlaceholder = '') =>
  Swal.fire({
    title,
    input: 'text',
    inputLabel,
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    ...brandButtons,
  });
