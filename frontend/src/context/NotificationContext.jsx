import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import "../styles/notifications.css";

const NotificationContext = createContext(null);

const ICONS = { success: "✓", error: "!", info: "i", warning: "!" };
const DURATION = 4000;

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = "info") => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, message, type }]);
      setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (m) => notify(m, "success"),
      error: (m) => notify(m, "error"),
      info: (m) => notify(m, "info"),
      warning: (m) => notify(m, "warning"),
    }),
    [notify],
  );

  // Resolves true/false once the user picks an option.
  const confirm = useCallback(
    ({
      title = "Are you sure?",
      message = "",
      confirmText = "Confirm",
      cancelText = "Cancel",
      danger = false,
    } = {}) =>
      new Promise((resolve) => {
        setDialog({ title, message, confirmText, cancelText, danger, resolve });
      }),
    [],
  );

  const closeDialog = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  useEffect(() => {
    if (!dialog) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        dialog.resolve(false);
        setDialog(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status">
            <span className="toast-icon">{ICONS[t.type]}</span>
            <span className="toast-message">{t.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {dialog && (
        <div className="confirm-overlay" onClick={() => closeDialog(false)}>
          <div
            className="confirm-box"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{dialog.title}</h3>
            {dialog.message && <p>{dialog.message}</p>}
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn confirm-cancel"
                onClick={() => closeDialog(false)}
              >
                {dialog.cancelText}
              </button>
              <button
                type="button"
                autoFocus
                className={`confirm-btn ${dialog.danger ? "confirm-danger" : "confirm-ok"}`}
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotify = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotify must be used inside <NotificationProvider>");
  return ctx;
};
