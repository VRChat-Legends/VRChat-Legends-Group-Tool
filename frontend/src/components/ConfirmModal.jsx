import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'OK',
    cancelLabel: 'Cancel',
    variant: 'confirm', // 'confirm' | 'alert'
    resolve: null,
  });

  const confirm = useCallback((message, title = 'Confirm') => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title,
        message,
        confirmLabel: 'OK',
        cancelLabel: 'Cancel',
        variant: 'confirm',
        resolve,
      });
    });
  }, []);

  const alert = useCallback((message, title = 'Notice') => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title,
        message,
        confirmLabel: 'OK',
        cancelLabel: null,
        variant: 'alert',
        resolve: () => resolve(undefined),
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false, resolve: null }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false, resolve: null }));
  }, [state.resolve]);

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={state.variant === 'confirm' ? handleCancel : undefined}>
          <div
            className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-surface-100 mb-2">{state.title}</h3>
            <p className="text-surface-300 text-sm mb-6 whitespace-pre-wrap">{state.message}</p>
            <div className="flex gap-3 justify-end">
              {state.variant === 'confirm' && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 font-medium"
                >
                  {state.cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium"
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) return { confirm: (msg, title) => Promise.resolve(window.confirm(title + '\n' + msg)), alert: (msg) => Promise.resolve(window.alert(msg)) };
  return ctx;
}
