import { useCallback, useMemo, useState } from 'react';
import { ToastContext } from './toast-context';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => removeToast(id), 3200);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  const palette = {
    success: { bg: '#dcfce7', border: '#4ade80', color: '#14532d' },
    error: { bg: '#fee2e2', border: '#f87171', color: '#7f1d1d' },
    info: { bg: '#ecfdf5', border: '#34d399', color: '#065f46' },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const theme = palette[toast.type] || palette.info;
          return (
            <div
              key={toast.id}
              style={{
                minWidth: '260px',
                maxWidth: '360px',
                background: theme.bg,
                color: theme.color,
                border: `1px solid ${theme.border}`,
                borderLeft: `6px solid ${theme.border}`,
                borderRadius: '14px',
                boxShadow: '0 18px 45px rgba(0, 0, 0, 0.12)',
                padding: '14px 16px',
                fontFamily: "'Segoe UI', sans-serif",
                fontSize: '14px',
                lineHeight: 1.5,
                pointerEvents: 'auto',
              }}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
