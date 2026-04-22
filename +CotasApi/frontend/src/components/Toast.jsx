function toastIcon(type) {
  if (type === "error") return "✕";
  if (type === "info") return "i";
  return "✓";
}

function Toast({ toast, onClose }) {
  if (!toast) {
    return null;
  }

  const type = toast.type === "error" || toast.type === "info" ? toast.type : "success";

  return (
    <div className="toast-wrap toast-wrap--visible" role="status" aria-live="polite">
      <div className={`toast toast-${type}`}>
        <span className={`toast-icon toast-icon--${type}`} aria-hidden="true">
          {toastIcon(type)}
        </span>
        <p className="toast-message">{toast.message}</p>
        <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss notification">
          ×
        </button>
      </div>
    </div>
  );
}

export default Toast;
