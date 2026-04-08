import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: add }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map(({ id, message, type }) => (
          <div
            key={id}
            className={`px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
              type === 'success' ? 'bg-emerald-500/90 text-white' :
              type === 'error' ? 'bg-red-500/90 text-white' :
              'bg-surface-800 text-surface-100 border border-surface-700'
            }`}
          >
            {message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx?.toast ?? (() => {});
}
